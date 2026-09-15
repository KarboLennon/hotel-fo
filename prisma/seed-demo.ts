import type { PrismaClient, ReservationStatus } from "@prisma/client";
import { addDays, set, startOfDay, subDays } from "date-fns";
import { buildCheckInLines } from "../src/server/services/folio";
import { calculateRate } from "../src/server/services/rate";

/**
 * Demo data for development: 20 guests + 20 reservations across every status,
 * with folios, payments, a few guest messages and one out-of-order room.
 * Skipped in production and whenever reservations already exist.
 */

type GuestSeed = {
  title: "MR" | "MRS" | "DR" | "MISS"; firstName: string; lastName: string; city: string; country: string;
  nationality: string; idType: "KTP" | "SIM" | "PASSPORT"; phone: string; guestType?: "REGULAR" | "REPEAT" | "VIP"; gender?: "MALE" | "FEMALE";
};

const GUESTS: GuestSeed[] = [
  { title: "MR", firstName: "Bhana", lastName: "Asif", city: "Jakarta", country: "Indonesia", nationality: "Indonesia", idType: "KTP", phone: "0812-1001-0001", guestType: "VIP", gender: "MALE" },
  { title: "MR", firstName: "Swapnil", lastName: "Shinde", city: "Mumbai", country: "India", nationality: "India", idType: "PASSPORT", phone: "+91-98200-11223", guestType: "REPEAT", gender: "MALE" },
  { title: "MRS", firstName: "Mulla", lastName: "Arif", city: "Surabaya", country: "Indonesia", nationality: "Indonesia", idType: "KTP", phone: "0813-2002-0002", gender: "FEMALE" },
  { title: "MR", firstName: "David", lastName: "Oko", city: "Lagos", country: "Nigeria", nationality: "Nigeria", idType: "PASSPORT", phone: "+234-802-333-4455", gender: "MALE" },
  { title: "MR", firstName: "Jim", lastName: "Morrison", city: "Los Angeles", country: "United States", nationality: "United States", idType: "PASSPORT", phone: "+1-310-555-0199", guestType: "VIP", gender: "MALE" },
  { title: "MISS", firstName: "Flora", lastName: "Hire", city: "Surat", country: "India", nationality: "India", idType: "PASSPORT", phone: "+91-98765-43210", gender: "FEMALE" },
  { title: "MR", firstName: "Marshall", lastName: "Alfred", city: "Bandung", country: "Indonesia", nationality: "Indonesia", idType: "SIM", phone: "0815-3003-0003", gender: "MALE" },
  { title: "MRS", firstName: "Ken", lastName: "Ang", city: "Singapore", country: "Singapore", nationality: "Singapore", idType: "PASSPORT", phone: "+65-9123-4567", guestType: "REPEAT", gender: "FEMALE" },
  { title: "MR", firstName: "Abraham", lastName: "John", city: "Chicago", country: "United States", nationality: "United States", idType: "PASSPORT", phone: "+1-312-555-0142", gender: "MALE" },
  { title: "DR", firstName: "Farin", lastName: "Alexander", city: "Medan", country: "Indonesia", nationality: "Indonesia", idType: "KTP", phone: "0817-4004-0004", gender: "MALE" },
  { title: "MISS", firstName: "Imtiyaz", lastName: "Adamjee", city: "Nairobi", country: "Kenya", nationality: "Kenya", idType: "PASSPORT", phone: "+254-722-123456", gender: "FEMALE" },
  { title: "MR", firstName: "Kalyan", lastName: "Ron", city: "Surat", country: "India", nationality: "India", idType: "PASSPORT", phone: "+91-98900-76543", gender: "MALE" },
  { title: "MRS", firstName: "Suzi", lastName: "Roma", city: "Yogyakarta", country: "Indonesia", nationality: "Indonesia", idType: "KTP", phone: "0818-5005-0005", gender: "FEMALE" },
  { title: "MR", firstName: "Victor", lastName: "Desouza", city: "Arlington", country: "United States", nationality: "United States", idType: "PASSPORT", phone: "+1-703-555-0177", gender: "MALE" },
  { title: "MR", firstName: "Larry", lastName: "Swot", city: "Semarang", country: "Indonesia", nationality: "Indonesia", idType: "SIM", phone: "0819-6006-0006", gender: "MALE" },
  { title: "MRS", firstName: "Robin", lastName: "D'Souza", city: "Antananarivo", country: "Madagascar", nationality: "Madagascar", idType: "PASSPORT", phone: "+261-34-12-345-67", gender: "FEMALE" },
  { title: "MR", firstName: "Mohammed", lastName: "Tofiq", city: "Makassar", country: "Indonesia", nationality: "Indonesia", idType: "KTP", phone: "0821-7007-0007", guestType: "REPEAT", gender: "MALE" },
  { title: "MISS", firstName: "Mark", lastName: "Tully", city: "Denpasar", country: "Indonesia", nationality: "Indonesia", idType: "KTP", phone: "0822-8008-0008" },
  { title: "MR", firstName: "Ted", lastName: "Raymond", city: "Boston", country: "United States", nationality: "United States", idType: "PASSPORT", phone: "+1-617-555-0133", gender: "MALE" },
  { title: "MRS", firstName: "Castillo", lastName: "Cesar", city: "Palembang", country: "Indonesia", nationality: "Indonesia", idType: "KTP", phone: "0823-9009-0009", gender: "FEMALE" },
];

type ResSeed = {
  status: ReservationStatus; room: string; arrivalOffset: number; nights: number; rateType: string;
  market: string; source?: string; adults?: number; children?: number; credit?: boolean; paid?: "none" | "partial" | "full";
  requests?: { name: string; qty: number }[]; voucher?: string; notes?: string;
};

// arrivalOffset is in days relative to today.
const RESERVATIONS: ResSeed[] = [
  // In house
  { status: "CHECKED_IN", room: "1001", arrivalOffset: -1, nights: 2, rateType: "American Plan", market: "Travel Agent", source: "Booking.com", adults: 2, paid: "partial", voucher: "BN45", notes: "Balcony room, no smoking" },
  { status: "CHECKED_IN", room: "1002", arrivalOffset: -2, nights: 3, rateType: "Daily", market: "Walk In", adults: 1, credit: true, paid: "none" },
  { status: "CHECKED_IN", room: "101", arrivalOffset: 0, nights: 1, rateType: "Weekday", market: "Domestic", adults: 2, children: 1, paid: "none", requests: [{ name: "Extra Bed", qty: 1 }] },
  { status: "CHECKED_IN", room: "102", arrivalOffset: -3, nights: 4, rateType: "Continental Plan", market: "Travel Agent", source: "Traveloka", adults: 2, paid: "full", voucher: "TRV-88120" },
  { status: "CHECKED_IN", room: "2001", arrivalOffset: -1, nights: 1, rateType: "Daily", market: "Taxi", adults: 2, paid: "none" },
  { status: "CHECKED_IN", room: "1003", arrivalOffset: 0, nights: 2, rateType: "Weekend", market: "Travel Agent", source: "Agoda", adults: 1, credit: true, paid: "partial", requests: [{ name: "Baby Cot", qty: 1 }] },
  // Checked out
  { status: "CHECKED_OUT", room: "103", arrivalOffset: -5, nights: 2, rateType: "Daily", market: "Walk In", adults: 2, paid: "full" },
  { status: "CHECKED_OUT", room: "1004", arrivalOffset: -4, nights: 3, rateType: "American Plan", market: "Travel Agent", source: "Tiket.com", adults: 2, credit: true, paid: "full", voucher: "TKT-55021" },
  { status: "CHECKED_OUT", room: "2002", arrivalOffset: -3, nights: 2, rateType: "Weekend", market: "Domestic", adults: 2, children: 2, paid: "full", requests: [{ name: "Extra Bed", qty: 2 }] },
  { status: "CHECKED_OUT", room: "104", arrivalOffset: -2, nights: 2, rateType: "Daily", market: "Walk In", adults: 1, paid: "full" },
  // Upcoming
  { status: "RESERVED", room: "105", arrivalOffset: 0, nights: 1, rateType: "Daily", market: "Walk In", adults: 2 },
  { status: "RESERVED", room: "1005", arrivalOffset: 0, nights: 3, rateType: "Continental Plan", market: "Travel Agent", source: "Booking.com", adults: 2, voucher: "BK-771902" },
  { status: "RESERVED", room: "106", arrivalOffset: 1, nights: 2, rateType: "Weekday", market: "Domestic", adults: 1 },
  { status: "RESERVED", room: "2003", arrivalOffset: 2, nights: 4, rateType: "American Plan", market: "Travel Agent", source: "Agoda", adults: 2, credit: true, notes: "Honeymoon, late check-in" },
  { status: "RESERVED", room: "1006", arrivalOffset: 3, nights: 2, rateType: "Weekend", market: "Walk In", adults: 2, children: 1 },
  { status: "RESERVED", room: "107", arrivalOffset: 5, nights: 1, rateType: "Daily", market: "Taxi", adults: 1 },
  { status: "RESERVED", room: "2004", arrivalOffset: 7, nights: 5, rateType: "American Plan", market: "Travel Agent", source: "Traveloka", adults: 2, voucher: "TRV-90311" },
  // Terminal
  { status: "CANCELLED", room: "108", arrivalOffset: 2, nights: 2, rateType: "Daily", market: "Domestic", adults: 2 },
  { status: "NO_SHOW", room: "1007", arrivalOffset: -1, nights: 1, rateType: "Daily", market: "Travel Agent", source: "Tiket.com", adults: 1 },
  { status: "VOID", room: "109", arrivalOffset: 4, nights: 1, rateType: "Weekday", market: "Walk In", adults: 1 },
];

const MESSAGES = [
  { guest: 0, from: "Sreejith Ray", company: "Qusai System", phone: "099-872188127", message: "Please call me on my mobile number", telephoned: true, rush: true },
  { guest: 2, from: "Mrs. Ken", company: "Ken Ang System", phone: "192892819899", message: "Call me, it's urgent regarding tomorrow's meeting", pleaseCall: true, willCallAgain: true },
  { guest: 4, from: "Front Desk", company: "", phone: "", message: "AC kurang dingin, teknisi dijadwalkan jam 15:00", special: true, delivered: true },
];

export async function seedDemo(db: PrismaClient) {
  if (process.env.NODE_ENV === "production") return;
  if ((await db.reservation.count()) > 0) { console.log("demo: reservations exist, skipping"); return; }

  const admin = await db.user.findUniqueOrThrow({ where: { email: "admin@hotel.local" } });
  const fo = (await db.user.findUnique({ where: { email: "fo@hotel.local" } })) ?? admin;
  const rooms = await db.room.findMany({ include: { roomType: true } });
  const rateTypes = await db.rateType.findMany();
  const rates = await db.rateTypeRoomTypeRate.findMany();
  const markets = await db.marketPlace.findMany();
  const sources = await db.source.findMany();
  const items = await db.specialRequestItem.findMany();
  const taxPercent = Number((await db.setting.findUnique({ where: { key: "taxPercent" } }))?.value ?? 0);

  const today = startOfDay(new Date());
  const at = (dayOffset: number, h: number, m = 0) => set(addDays(today, dayOffset), { hours: h, minutes: m, seconds: 0, milliseconds: 0 });
  const byName = <T extends { name: string }>(list: T[], name: string) => {
    const found = list.find((x) => x.name === name);
    if (!found) throw new Error(`demo seed: missing ${name}`);
    return found;
  };

  for (let i = 0; i < RESERVATIONS.length; i++) {
    const g = GUESTS[i];
    const r = RESERVATIONS[i];
    const room = byName(rooms.map((x) => ({ ...x, name: x.number })), r.room);
    const rateType = byName(rateTypes, r.rateType);
    const market = byName(markets, r.market);
    const source = r.source ? byName(sources, r.source) : null;
    const rateRow = rates.find((x) => x.rateTypeId === rateType.id && x.roomTypeId === room.roomTypeId);
    const ratePerNight = Number(rateRow?.rate ?? room.roomType.baseRate);
    const arrival = at(r.arrivalOffset, 14);
    const departure = at(r.arrivalOffset + r.nights, 12);
    const requests = (r.requests ?? []).map((q) => ({ item: byName(items, q.name), qty: q.qty }));

    const guest = await db.guest.create({
      data: {
        title: g.title, firstName: g.firstName, lastName: g.lastName,
        address: `Jl. Contoh No. ${i + 1}`, city: g.city, postal: String(10000 + i * 37), country: g.country,
        email: `${g.firstName}.${g.lastName.replace(/[^a-z]/gi, "")}@example.com`.toLowerCase(), phone: g.phone,
        idType: g.idType, idNumber: `${g.idType}-${String(1000000 + i * 7919)}`, idLifetime: g.idType === "KTP",
        idExpMonth: g.idType === "KTP" ? null : ((i % 12) + 1), idExpYear: g.idType === "KTP" ? null : 2028 + (i % 5),
        nationality: g.nationality, state: g.city, birthDate: new Date(1975 + (i % 25), i % 12, 1 + (i % 27)),
        birthCity: g.city, birthCountry: g.country, gender: g.gender ?? null, guestType: g.guestType ?? "REGULAR",
        occupation: ["Engineer", "Consultant", "Teacher", "Trader", "Designer"][i % 5],
      },
    });

    const checkedIn = r.status === "CHECKED_IN" || r.status === "CHECKED_OUT";
    const reservation = await db.reservation.create({
      data: {
        guestId: guest.id, roomId: room.id, rateTypeId: rateType.id, marketPlaceId: market.id, sourceId: source?.id ?? null,
        arrival, departure, nights: r.nights, adults: r.adults ?? 1, children: r.children ?? 0, infants: 0,
        status: r.status, settlementMethod: r.credit ? "CREDIT" : "CASH",
        cardType: r.credit ? (i % 2 ? "VISA" : "MASTERCARD") : null, cardLast4: r.credit ? String(4000 + i) : null, cardExpiry: r.credit ? "09/28" : null,
        voucherNo: r.voucher ?? null, notes: r.notes ?? null, ratePerNight,
        bookedById: i % 3 === 0 ? admin.id : fo.id,
        checkedInById: checkedIn ? fo.id : null, checkedInAt: checkedIn ? at(r.arrivalOffset, 14, 20) : null,
        checkedOutById: r.status === "CHECKED_OUT" ? fo.id : null, checkedOutAt: r.status === "CHECKED_OUT" ? at(r.arrivalOffset + r.nights, 11, 45) : null,
        createdAt: at(Math.min(r.arrivalOffset, 0) - 3, 10),
        folio: { create: {} },
        specialRequests: { create: requests.map((q) => ({ itemId: q.item.id, qty: q.qty })) },
      },
      include: { folio: true },
    });

    if (checkedIn && reservation.folio) {
      const lines = buildCheckInLines({
        arrival, nights: r.nights, ratePerNight, taxPercent,
        specialRequests: requests.map((q) => ({ name: q.item.name, price: Number(q.item.price), qty: q.qty })),
      });
      const rate = calculateRate({
        ratePerNight, nights: r.nights, taxPercent,
        specialRequests: requests.map((q) => ({ price: Number(q.item.price), qty: q.qty })),
      });
      const payments: { amount: number; description: string; kind: "PAYMENT" | "DEPOSIT" }[] = [];
      if (r.paid === "partial") payments.push({ amount: Math.round(rate.total / 2), description: "Deposit on arrival", kind: "DEPOSIT" });
      if (r.paid === "full") payments.push({ amount: rate.total, description: r.credit ? "Card payment" : "Cash", kind: "PAYMENT" });
      await db.folioLine.createMany({
        data: [
          ...lines.map((l) => ({ folioId: reservation.folio!.id, kind: l.kind, description: l.description, amount: l.amount, date: at(r.arrivalOffset, 14, 20) })),
          ...payments.map((p) => ({ folioId: reservation.folio!.id, kind: p.kind, description: p.description, amount: -p.amount, date: at(r.status === "CHECKED_OUT" ? r.arrivalOffset + r.nights : r.arrivalOffset, 11) })),
        ],
      });
    }
    if (r.status === "CHECKED_OUT" && i % 2 === 0) {
      await db.room.update({ where: { id: room.id }, data: { isDirty: true } });
    }
  }

  const inHouse = await db.reservation.findMany({ where: { status: "CHECKED_IN" }, orderBy: { createdAt: "asc" } });
  for (const m of MESSAGES) {
    const res = inHouse[m.guest % inHouse.length];
    await db.guestMessage.create({
      data: {
        roomId: res.roomId, guestId: res.guestId, fromName: m.from, company: m.company || null, phone: m.phone || null, message: m.message,
        telephoned: !!m.telephoned, pleaseCall: !!m.pleaseCall, willCallAgain: !!m.willCallAgain, rush: !!m.rush, special: !!m.special, delivered: !!m.delivered,
      },
    });
  }

  const ooo = byName(rooms.map((x) => ({ ...x, name: x.number })), "2008");
  await db.outOfOrder.create({ data: { roomId: ooo.id, fromDate: subDays(today, 1), toDate: null, remark: "AC unit replacement", createdById: admin.id } });

  console.log(`demo: ${RESERVATIONS.length} guests + reservations, ${MESSAGES.length} messages, 1 out-of-order room`);
}
