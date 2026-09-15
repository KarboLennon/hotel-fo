"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { ok, fail, zodFail, type ActionResult } from "@/lib/action-result";
import { publicBookingSchema, type PublicBookingInput } from "@/lib/validation/public-booking";
import { parseStay, makeVoucherNumber } from "@/server/services/booking";
import { isRoomAvailable } from "@/server/services/availability";
import { getSettings } from "@/server/queries/options";
import { DIRECT_SOURCE } from "@/server/queries/public-booking";
import { logError } from "@/server/log";

class NoRoomError extends Error {}

const STAY_MESSAGE: Record<string, string> = {
  INVALID_DATE: "Tanggal tidak valid", ARRIVAL_IN_PAST: "Tanggal check-in sudah lewat",
  DEPARTURE_NOT_AFTER_ARRIVAL: "Check-out harus setelah check-in", TOO_LONG: "Maksimal 30 malam",
};

/**
 * Guest-side booking (no login). Creates a new guest + RESERVED reservation on the first free room
 * of the chosen type. Rooms are locked one at a time (FOR UPDATE) so two guests cannot grab the same room.
 */
export async function createPublicBooking(raw: PublicBookingInput): Promise<ActionResult<{ id: string }>> {
  const parsed = publicBookingSchema.safeParse(raw);
  if (!parsed.success) return zodFail(parsed.error);
  const input = parsed.data;
  try {
    const settings = await getSettings();
    const stay = parseStay(input.arrival, input.departure, { checkIn: settings.checkInTime, checkOut: settings.checkOutTime });
    if (!stay.ok) return fail(STAY_MESSAGE[stay.error], { arrival: [STAY_MESSAGE[stay.error]] });

    const [roomType, marketPlaces, source, dailyRate, systemUser] = await Promise.all([
      db.roomType.findUnique({ where: { id: input.roomTypeId } }),
      db.marketPlace.findMany(),
      input.source === DIRECT_SOURCE ? null : db.source.findUnique({ where: { id: input.source } }),
      db.rateType.findUnique({ where: { name: "Daily" }, include: { rates: true } }),
      db.user.findUnique({ where: { email: "web@hotel.local" } }),
    ]);
    if (!roomType) return fail("Tipe kamar tidak ditemukan", { roomTypeId: ["Pilih tipe kamar"] });
    if (input.source !== DIRECT_SOURCE && !source) return fail("Sumber booking tidak dikenal", { source: ["Pilih sumber booking"] });
    const marketPlace = source
      ? marketPlaces.find((m) => m.requiresSource)
      : marketPlaces.find((m) => m.name === "Website") ?? marketPlaces.find((m) => m.name === "Domestic");
    if (!marketPlace) return fail("Market place belum dikonfigurasi");
    const bookedBy = systemUser ?? (await db.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } }));
    if (!bookedBy) return fail("Belum ada user sistem untuk mencatat booking");
    const ratePerNight = Number(dailyRate?.rates.find((r) => r.roomTypeId === roomType.id)?.rate ?? roomType.baseRate);
    const rateTypeId = dailyRate?.id ?? (await db.rateType.findFirstOrThrow()).id;
    const cardDigits = (input.cardNumber ?? "").replace(/\D/g, "");

    const created = await db.$transaction(async (tx) => {
      const rooms = await tx.room.findMany({ where: { roomTypeId: roomType.id }, select: { id: true, number: true } });
      rooms.sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));
      for (const room of rooms) {
        // Lock order: Room → Reservation (project convention). One room at a time; move on if it is taken.
        await tx.$queryRaw`SELECT "id" FROM "Room" WHERE "id" = ${room.id} FOR UPDATE`;
        const [reservations, ooo] = await Promise.all([
          tx.reservation.findMany({ where: { roomId: room.id, status: { in: ["RESERVED", "CHECKED_IN"] } }, select: { id: true, status: true, arrival: true, departure: true } }),
          tx.outOfOrder.findMany({ where: { roomId: room.id }, select: { fromDate: true, toDate: true } }),
        ]);
        if (!isRoomAvailable(stay.stay.arrival, stay.stay.departure, reservations, ooo)) continue;

        const guest = await tx.guest.create({
          data: {
            title: input.title, firstName: input.firstName, lastName: input.lastName, email: input.email, phone: input.phone,
            address: input.address, city: input.city, postal: input.postal, country: input.country, state: input.state,
            nationality: input.nationality, idType: input.idType, idNumber: input.idNumber, idLifetime: input.idType === "KTP",
            idExpMonth: input.idType === "KTP" ? null : 12, idExpYear: input.idType === "KTP" ? null : new Date().getFullYear() + 5,
            birthCity: input.birthCity, guestType: "REGULAR",
          },
        });
        return tx.reservation.create({
          data: {
            guestId: guest.id, roomId: room.id, rateTypeId, marketPlaceId: marketPlace.id, sourceId: source?.id ?? null,
            arrival: stay.stay.arrival, departure: stay.stay.departure, nights: stay.stay.nights,
            adults: input.adults, children: input.children, infants: 0, status: "RESERVED",
            settlementMethod: input.paymentMethod,
            cardType: input.paymentMethod === "CREDIT" && input.cardType ? input.cardType : null,
            cardLast4: input.paymentMethod === "CREDIT" ? cardDigits.slice(-4) : null,
            cardExpiry: input.paymentMethod === "CREDIT" ? input.cardExpiry || null : null,
            voucherNo: source ? makeVoucherNumber(source.name) : null,
            notes: input.notes || null, ratePerNight, bookedById: bookedBy.id, folio: { create: {} },
          },
        });
      }
      throw new NoRoomError();
    });

    revalidatePath("/fo"); revalidatePath("/fo/reservations"); revalidatePath("/fo/guest-ledger"); revalidatePath("/fo/guests");
    return ok({ id: created.id });
  } catch (e) {
    if (e instanceof NoRoomError) return fail("Maaf, tipe kamar ini sudah penuh di tanggal tersebut", { roomTypeId: ["Kamar penuh"] });
    logError("createPublicBooking", e);
    return fail("Booking gagal diproses, coba lagi");
  }
}
