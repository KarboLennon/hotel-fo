"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";
import { logError } from "@/server/log";
import { ok, fail, zodFail, type ActionResult } from "@/lib/action-result";
import { reservationSchema, type ReservationInput } from "@/lib/validation/reservation";
import { combineDateTime, nightsFromDates } from "@/server/services/dates";
import { isRoomAvailable } from "@/server/services/availability";
import { guestData } from "@/server/queries/guests";
import type { Prisma } from "@prisma/client";

class RoomUnavailableError extends Error {}
class NotFoundError extends Error {}
class ClosedError extends Error {}

async function roomWindows(tx: Prisma.TransactionClient, roomId: string) {
  const [reservations, ooo] = await Promise.all([
    tx.reservation.findMany({ where: { roomId, status: { in: ["RESERVED", "CHECKED_IN"] } }, select: { id: true, status: true, arrival: true, departure: true } }),
    tx.outOfOrder.findMany({ where: { roomId }, select: { fromDate: true, toDate: true } }),
  ]);
  return { reservations, ooo };
}

export async function saveReservation(raw: ReservationInput, id?: string): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = reservationSchema.safeParse(raw);
  if (!parsed.success) return zodFail(parsed.error);
  const input = parsed.data;

  try {
    const [room, marketPlace, rateType] = await Promise.all([
      db.room.findUnique({ where: { id: input.roomId }, include: { roomType: true } }),
      db.marketPlace.findUnique({ where: { id: input.marketPlaceId } }),
      db.rateType.findUnique({ where: { id: input.rateTypeId } }),
    ]);
    if (!room) return fail("Kamar tidak ditemukan", { roomId: ["Pilih kamar"] });
    if (!marketPlace) return fail("Market place tidak ditemukan", { marketPlaceId: ["Pilih market place"] });
    if (!rateType) return fail("Rate type tidak ditemukan", { rateTypeId: ["Pilih rate type"] });
    if (marketPlace.requiresSource && !input.sourceId) return fail("Source wajib diisi", { sourceId: ["Pilih source"] });
    if (room.roomTypeId !== input.roomTypeId) return fail("Kamar tidak sesuai room type", { roomId: ["Pilih kamar sesuai room type"] });

    const rateRow = await db.rateTypeRoomTypeRate.findUnique({ where: { rateTypeId_roomTypeId: { rateTypeId: input.rateTypeId, roomTypeId: room.roomTypeId } } });
    const ratePerNight = rateRow ? Number(rateRow.rate) : Number(room.roomType.baseRate);
    const arrival = combineDateTime(input.arrivalDate, input.arrivalTime);
    const departure = combineDateTime(input.departureDate, input.departureTime);
    const nights = nightsFromDates(arrival, departure);
    const cardLast4 = input.settlementMethod === "CREDIT" ? input.cardNumber?.replace(/\D/g, "").slice(-4) || null : null;
    // One row per item: the schema rejects duplicates, but a duplicate slipping through
    // would violate the (reservationId, itemId) unique index, so fold them here too.
    const specialRequests = [...input.specialRequests.reduce((m, s) => m.set(s.itemId, (m.get(s.itemId) ?? 0) + s.qty), new Map<string, number>())]
      .map(([itemId, qty]) => ({ itemId, qty }));

    const saved = await db.$transaction(async (tx) => {
      // Project lock order: Room → Reservation. We don't yet know whether the stay is locked
      // (that decision needs a locked re-read below), so lock every Room row this save could
      // touch up front: the room the reservation is currently in (if editing) and the room
      // being requested, if different. Lock them in a deterministic (sorted) order so two
      // concurrent saves swapping guests between the same pair of rooms can't deadlock. Only
      // then lock the Reservation row itself, and re-read it under both locks.
      const head = id ? await tx.reservation.findUnique({ where: { id }, select: { roomId: true } }) : null;
      if (id && !head) throw new NotFoundError();

      const roomIds = head && head.roomId !== room.id ? [head.roomId, room.id].sort() : [room.id];
      for (const rid of roomIds) {
        await tx.$queryRaw`SELECT "id" FROM "Room" WHERE "id" = ${rid} FOR UPDATE`;
      }
      if (id) {
        await tx.$queryRaw`SELECT "id" FROM "Reservation" WHERE "id" = ${id} FOR UPDATE`;
      }

      const existing = id ? await tx.reservation.findUnique({ where: { id } }) : null;
      if (id && !existing) throw new NotFoundError();
      if (existing && existing.status !== "RESERVED" && existing.status !== "CHECKED_IN") throw new ClosedError();
      // After check-in the folio already holds the room charges, tax and special request
      // lines for the stored stay. Editing stay / rate / room / source / special requests
      // would desync the folio, so those inputs are ignored and the stored values kept.
      const stayLocked = existing?.status === "CHECKED_IN";

      if (!stayLocked) {
        const { reservations, ooo } = await roomWindows(tx, room.id);
        if (!isRoomAvailable(arrival, departure, reservations, ooo, id)) throw new RoomUnavailableError();
      }

      const guest = input.guestId
        ? await tx.guest.update({ where: { id: input.guestId }, data: guestData(input.guest) })
        : await tx.guest.create({ data: guestData(input.guest) });

      const editable = {
        guestId: guest.id,
        settlementMethod: input.settlementMethod, cardType: input.settlementMethod === "CREDIT" && input.cardType ? input.cardType : null,
        cardLast4, cardExpiry: input.settlementMethod === "CREDIT" ? input.cardExpiry || null : null,
        voucherNo: input.voucherNo || null, notes: input.notes || null,
      };
      const data = {
        ...editable,
        roomId: room.id, rateTypeId: input.rateTypeId, marketPlaceId: input.marketPlaceId,
        sourceId: marketPlace.requiresSource ? input.sourceId! : null,
        arrival, departure, nights, adults: input.adults, children: input.children, infants: input.infants,
        ratePerNight,
      };
      const res = id
        ? await tx.reservation.update({ where: { id }, data: stayLocked ? editable : data })
        : await tx.reservation.create({ data: { ...data, bookedById: user.id, folio: { create: {} } } });

      if (!stayLocked) {
        await tx.reservationSpecialRequest.deleteMany({ where: { reservationId: res.id } });
        if (specialRequests.length) {
          await tx.reservationSpecialRequest.createMany({ data: specialRequests.map((s) => ({ reservationId: res.id, itemId: s.itemId, qty: s.qty })) });
        }
      }
      return res;
    });
    revalidatePath("/fo"); revalidatePath("/fo/reservations"); revalidatePath(`/fo/reservations/${saved.id}`); revalidatePath("/fo/guest-ledger");
    return ok({ id: saved.id });
  } catch (e) {
    if (e instanceof NotFoundError) return fail("Reservasi tidak ditemukan");
    if (e instanceof ClosedError) return fail("Reservasi tidak bisa diubah lagi");
    if (e instanceof RoomUnavailableError) return fail("Kamar tidak tersedia pada tanggal tersebut", { roomId: ["Kamar sudah terisi / out of order pada tanggal ini"] });
    logError("saveReservation", e);
    return fail("Gagal menyimpan reservasi");
  }
}

export async function getAvailableRooms(roomTypeId: string, arrivalDate: string, departureDate: string, excludeReservationId?: string) {
  await requireUser();
  const validDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
  const datesValid = validDate.safeParse(arrivalDate).success && validDate.safeParse(departureDate).success;
  if (!datesValid || !roomTypeId) return [];
  const arrival = combineDateTime(arrivalDate, "00:00");
  const departure = combineDateTime(departureDate, "00:00");
  try {
    const rooms = await db.room.findMany({
      where: { roomTypeId },
      include: {
        reservations: { where: { status: { in: ["RESERVED", "CHECKED_IN"] } }, select: { id: true, status: true, arrival: true, departure: true } },
        outOfOrders: { select: { fromDate: true, toDate: true } },
      },
    });
    return rooms
      .filter((r) => isRoomAvailable(arrival, departure, r.reservations, r.outOfOrders, excludeReservationId))
      .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0))
      .map((r) => ({ id: r.id, number: r.number }));
  } catch (e) {
    logError("getAvailableRooms", e);
    return [];
  }
}
