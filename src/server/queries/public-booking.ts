import { db } from "@/server/db";
import { getSettings } from "./options";
import { countAvailable, parseStay, type Stay } from "@/server/services/booking";
import { bookingSearchSchema } from "@/lib/validation/public-booking";
import { calculateRate } from "@/server/services/rate";
import { formatReservationNumber } from "@/server/services/numbering";

export const DIRECT_SOURCE = "direct";

/** Booking channels offered on the landing page: the hotel website plus every OTA in the Source table. */
export async function getBookingSources() {
  const sources = await db.source.findMany({ orderBy: { name: "asc" } });
  return [{ id: DIRECT_SOURCE, name: "Website hotel (langsung)" }, ...sources.map((s) => ({ id: s.id, name: s.name }))];
}

const DESCRIPTIONS: Record<string, { size: string; bed: string; blurb: string }> = {
  "Super Deluxe": { size: "32 m²", bed: "1 King atau 2 Twin", blurb: "Kamar luas dengan pemandangan kota, area kerja, dan kamar mandi marmer." },
  "King Suite": { size: "48 m²", bed: "1 King", blurb: "Suite dengan ruang tamu terpisah, walk-in closet, dan akses lounge." },
  "Presidential": { size: "120 m²", bed: "1 King + kamar tamu", blurb: "Suite lantai atas dengan ruang makan, dapur kecil, dan butler service." },
};

export async function getRoomTypeAvailability(stay: Stay) {
  const [types, daily] = await Promise.all([
    db.roomType.findMany({
      orderBy: { baseRate: "asc" },
      include: {
        rooms: {
          include: {
            reservations: { where: { status: { in: ["RESERVED", "CHECKED_IN"] } }, select: { id: true, status: true, arrival: true, departure: true } },
            outOfOrders: { select: { fromDate: true, toDate: true } },
          },
        },
      },
    }),
    db.rateType.findUnique({ where: { name: "Daily" }, include: { rates: true } }),
  ]);
  return types.map((t) => {
    const rate = daily?.rates.find((r) => r.roomTypeId === t.id);
    const ratePerNight = Number(rate?.rate ?? t.baseRate);
    const candidates = t.rooms.map((room) => ({ room, reservations: room.reservations, ooo: room.outOfOrders }));
    return {
      id: t.id, name: t.name, ratePerNight, totalRooms: t.rooms.length,
      available: countAvailable(candidates, stay.arrival, stay.departure),
      ...(DESCRIPTIONS[t.name] ?? { size: "", bed: "", blurb: "" }),
    };
  });
}
export type RoomTypeOffer = Awaited<ReturnType<typeof getRoomTypeAvailability>>[number];

export async function getStayQuote(stay: Stay, roomTypeId: string) {
  const [types, settings] = await Promise.all([getRoomTypeAvailability(stay), getSettings()]);
  const type = types.find((t) => t.id === roomTypeId);
  if (!type) return null;
  const rate = calculateRate({ ratePerNight: type.ratePerNight, nights: stay.nights, taxPercent: settings.taxPercent });
  return { type, rate, taxPercent: settings.taxPercent };
}

export async function getPublicConfirmation(id: string) {
  const r = await db.reservation.findUnique({
    where: { id },
    include: { guest: true, room: { include: { roomType: true } }, marketPlace: true, source: true, rateType: true },
  });
  if (!r) return null;
  const settings = await getSettings();
  const rate = calculateRate({ ratePerNight: Number(r.ratePerNight), nights: r.nights, taxPercent: settings.taxPercent });
  return {
    id: r.id, number: formatReservationNumber(r.seq), status: r.status,
    guestName: `${r.guest.firstName} ${r.guest.lastName}`, email: r.guest.email, phone: r.guest.phone ?? "",
    roomNumber: r.room.number, roomType: r.room.roomType.name, arrival: r.arrival, departure: r.departure, nights: r.nights,
    adults: r.adults, children: r.children, channel: r.source?.name ?? r.marketPlace.name, voucherNo: r.voucherNo,
    settlementMethod: r.settlementMethod, cardType: r.cardType, cardLast4: r.cardLast4, notes: r.notes,
    ratePerNight: Number(r.ratePerNight), rate, taxPercent: settings.taxPercent, createdAt: r.createdAt,
  };
}

/** Parses landing-page search params, validates the stay against hotel settings and resolves the channel label. */
export async function resolveBookingSearch(sp: Record<string, string | undefined>) {
  const parsed = bookingSearchSchema.safeParse(sp);
  if (!parsed.success) return { ok: false as const, message: "Pencarian tidak valid" };
  const search = parsed.data;
  const settings = await getSettings();
  const stay = parseStay(search.arrival, search.departure, { checkIn: settings.checkInTime, checkOut: settings.checkOutTime });
  if (!stay.ok) {
    const msg: Record<string, string> = { INVALID_DATE: "Tanggal tidak valid", ARRIVAL_IN_PAST: "Tanggal check-in sudah lewat", DEPARTURE_NOT_AFTER_ARRIVAL: "Check-out harus setelah check-in", TOO_LONG: "Maksimal 30 malam" };
    return { ok: false as const, message: msg[stay.error] };
  }
  const sources = await getBookingSources();
  const channel = sources.find((s) => s.id === search.source);
  if (!channel) return { ok: false as const, message: "Sumber booking tidak dikenal" };
  return { ok: true as const, search, stay: stay.stay, channel, taxPercent: settings.taxPercent };
}
