import { db } from "@/server/db";
import { formatFolioNumber, formatReservationNumber } from "@/server/services/numbering";

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
