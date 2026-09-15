import { addDays } from "date-fns";
import type { FolioLineKind, Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { combineDateTime } from "@/server/services/dates";
import { formatFolioNumber, formatReservationNumber } from "@/server/services/numbering";

export type LookingFor = "inhouse" | "checkedout" | "reserved";
export interface LedgerFilter { from: string; to: string; guestName?: string; marketPlaceId?: string; sourceId?: string; roomTypeId?: string; lookingFor: LookingFor }

const STATUS: Record<LookingFor, Prisma.ReservationWhereInput> = { inhouse: { status: "CHECKED_IN" }, checkedout: { status: "CHECKED_OUT" }, reserved: { status: "RESERVED" } };

export async function getLedger(f: LedgerFilter) {
  const from = combineDateTime(f.from, "00:00");
  const to = addDays(combineDateTime(f.to, "00:00"), 1);
  const rows = await db.reservation.findMany({
    where: {
      AND: [
        STATUS[f.lookingFor],
        // departure is exclusive: a stay that left on the "from" day does not overlap the window.
        { arrival: { lt: to }, departure: { gt: from } },
        f.guestName ? { guest: { OR: [{ lastName: { contains: f.guestName, mode: "insensitive" } }, { firstName: { contains: f.guestName, mode: "insensitive" } }] } } : {},
        f.marketPlaceId ? { marketPlaceId: f.marketPlaceId } : {}, f.sourceId ? { sourceId: f.sourceId } : {}, f.roomTypeId ? { room: { roomTypeId: f.roomTypeId } } : {},
      ],
    },
    include: { guest: true, room: { include: { roomType: true } }, rateType: true, source: true, bookedBy: { select: { name: true } }, folio: { include: { lines: true } } },
    orderBy: [{ arrival: "asc" }, { seq: "asc" }],
  });
  const breakdown: Record<FolioLineKind, number> = { ROOM_CHARGE: 0, TAX: 0, EXTRA: 0, SPECIAL_REQUEST: 0, PAYMENT: 0, DEPOSIT: 0 };
  const out = rows.map((r) => {
    const lines = r.folio?.lines ?? [];
    for (const l of lines) breakdown[l.kind] += Number(l.amount);
    return {
      id: r.id, roomNumber: r.room.number, reservationNumber: formatReservationNumber(r.seq), folioNumber: r.folio ? formatFolioNumber(r.folio.seq) : "",
      voucherNo: r.voucherNo ?? "", arrival: r.arrival, departure: r.departure, guestName: `${r.guest.firstName} ${r.guest.lastName}`,
      email: r.guest.email, phone: r.guest.phone ?? "", identity: `${r.guest.idType} ${r.guest.idNumber}`, bookedBy: r.bookedBy.name, sourceName: r.source?.name ?? "",
      roomType: r.room.roomType.name, rateType: r.rateType.name, balance: lines.reduce((s, l) => s + Number(l.amount), 0), pax: `${r.adults}/${r.children}`, status: r.status,
    };
  });
  return { rows: out, breakdown, totalBalance: out.reduce((s, r) => s + r.balance, 0) };
}
export type LedgerRow = Awaited<ReturnType<typeof getLedger>>["rows"][number];
