import { addDays, isValid, parseISO, startOfDay } from "date-fns";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { deriveRoomStatus, matchesFilter, type DerivedRoomState } from "@/server/services/room-status";
import { formatFolioNumber, formatReservationNumber } from "@/server/services/numbering";
import { STATUS_FILTERS, type ReservationStatus, type StatusFilter } from "@/lib/constants";

export interface RoomRow {
  id: string; number: string; floor: string; typeName: string;
  state: DerivedRoomState;
  reservation: {
    id: string; number: string; status: ReservationStatus; guestName: string;
    arrival: Date; departure: Date; folioNumber: string | null; voucherNo: string | null;
    sourceName: string | null; rateTypeName: string; balance: number; adults: number; children: number;
  } | null;
}

export function parseDateParam(s?: string): Date {
  if (s) { const d = parseISO(s); if (isValid(d)) return startOfDay(d); }
  return startOfDay(new Date());
}

const roomNum = (n: string) => Number(n) || 0;

export async function getDashboard(date: Date) {
  const day = startOfDay(date);
  const next = addDays(day, 1);
  const today = startOfDay(new Date());
  // On today and in the past an in-house stay still holds the room even past its
  // departure (overstay). On a future day only stays that run past that day matter.
  const checkedIn: Prisma.ReservationWhereInput = day <= today ? { status: "CHECKED_IN" } : { status: "CHECKED_IN", departure: { gt: day } };
  const rooms = await db.room.findMany({
    include: {
      roomType: true,
      reservations: {
        where: { OR: [checkedIn, { status: "RESERVED", arrival: { lt: next }, departure: { gt: day } }] },
        include: { guest: true, rateType: true, source: true, folio: { include: { lines: true } } },
      },
      outOfOrders: { where: { fromDate: { lt: next }, OR: [{ toDate: null }, { toDate: { gt: day } }] } },
    },
  });

  const rows: RoomRow[] = rooms
    .sort((a, b) => roomNum(a.number) - roomNum(b.number))
    .map((room) => {
      const state = deriveRoomStatus(room, room.reservations, room.outOfOrders, day, today);
      const r = state.current ? room.reservations.find((x) => x.id === state.current!.id) : undefined;
      return {
        id: room.id, number: room.number, floor: room.floor, typeName: room.roomType.name, state,
        reservation: r ? {
          id: r.id, number: formatReservationNumber(r.seq), status: r.status,
          guestName: `${r.guest.title === "MR" ? "Mr." : r.guest.title === "MRS" ? "Mrs." : r.guest.title === "DR" ? "Dr." : "Miss"} ${r.guest.firstName} ${r.guest.lastName}`,
          arrival: r.arrival, departure: r.departure,
          folioNumber: r.folio ? formatFolioNumber(r.folio.seq) : null, voucherNo: r.voucherNo,
          sourceName: r.source?.name ?? null, rateTypeName: r.rateType.name,
          balance: r.folio ? r.folio.lines.reduce((s, l) => s + Number(l.amount), 0) : 0,
          adults: r.adults, children: r.children,
        } : null,
      };
    });

  const counters = Object.fromEntries(STATUS_FILTERS.map((f) => [f, rows.filter((r) => matchesFilter(r.state, f)).length])) as Record<StatusFilter, number>;
  const floorMin = new Map<string, number>();
  for (const r of rows) floorMin.set(r.floor, Math.min(floorMin.get(r.floor) ?? Infinity, roomNum(r.number)));
  const floors = [...floorMin.entries()].sort((a, b) => a[1] - b[1]).map(([f]) => f);
  return { rooms: rows, counters, floors };
}

export function buildDashboardHref(patch: Record<string, string | undefined>, current: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...patch })) if (v) p.set(k, v);
  const q = p.toString();
  return q ? `/?${q}` : "/";
}
