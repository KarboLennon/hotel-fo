import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { formatFolioNumber, formatReservationNumber, parseReservationNumber } from "@/server/services/numbering";

export async function getReservationDetail(id: string) {
  const r = await db.reservation.findUnique({
    where: { id },
    include: {
      guest: true, room: { include: { roomType: true } }, rateType: true, marketPlace: true, source: true,
      folio: { include: { lines: { orderBy: { date: "asc" } } } },
      specialRequests: { include: { item: true } },
      bookedBy: { select: { name: true } }, checkedInBy: { select: { name: true } }, checkedOutBy: { select: { name: true } },
    },
  });
  if (!r) return null;
  const lines = (r.folio?.lines ?? []).map((l) => ({ id: l.id, kind: l.kind, description: l.description, amount: Number(l.amount), date: l.date }));
  return {
    ...r,
    ratePerNight: Number(r.ratePerNight),
    number: formatReservationNumber(r.seq),
    folioNumber: r.folio ? formatFolioNumber(r.folio.seq) : null,
    lines,
    balance: lines.reduce((s, l) => s + l.amount, 0),
    specialRequests: r.specialRequests.map((s) => ({ itemId: s.itemId, qty: s.qty, name: s.item.name, price: Number(s.item.price) })),
  };
}
export type ReservationDetail = NonNullable<Awaited<ReturnType<typeof getReservationDetail>>>;

export type ListFilter = "active" | "cancelled" | "noshow" | "void" | "all";
const FILTER_STATUS: Record<ListFilter, Prisma.ReservationWhereInput> = {
  active: { status: { in: ["RESERVED", "CHECKED_IN"] } }, cancelled: { status: "CANCELLED" }, noshow: { status: "NO_SHOW" }, void: { status: "VOID" }, all: {},
};

export async function listReservations(filter: ListFilter, q: string) {
  const term = q.trim();
  const seq = parseReservationNumber(term);
  const search: Prisma.ReservationWhereInput = term
    ? { OR: [...(seq ? [{ seq }] : []), { guest: { lastName: { contains: term, mode: "insensitive" } } }, { room: { number: term } }, { voucherNo: { contains: term, mode: "insensitive" } }] }
    : {};
  const rows = await db.reservation.findMany({
    where: { AND: [FILTER_STATUS[filter], search] },
    include: { guest: true, room: true, source: true },
    orderBy: [{ arrival: "desc" }, { seq: "desc" }], take: 500,
  });
  return rows.map((r) => ({
    id: r.id, number: formatReservationNumber(r.seq), roomNumber: r.room.number, lastName: r.guest.lastName, firstName: r.guest.firstName,
    createdAt: r.createdAt, arrival: r.arrival, departure: r.departure, sourceName: r.source?.name ?? "", voucherNo: r.voucherNo ?? "", status: r.status,
  }));
}
export type ReservationListRow = Awaited<ReturnType<typeof listReservations>>[number];
