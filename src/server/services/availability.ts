import { startOfDay } from "date-fns";
import type { OooWindow, ReservationWindow } from "./room-status";

const t = (d: Date) => startOfDay(d).getTime();

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date | null): boolean {
  const as = t(aStart), ae = t(aEnd), bs = t(bStart);
  const be = bEnd === null ? Number.POSITIVE_INFINITY : t(bEnd);
  return as < be && bs < ae;
}

export const BLOCKING_STATUSES = new Set(["RESERVED", "CHECKED_IN"]);

export function isRoomAvailable(
  arrival: Date,
  departure: Date,
  reservations: ReservationWindow[],
  ooo: OooWindow[],
  excludeReservationId?: string,
): boolean {
  const blockedByReservation = reservations.some(
    (r) => r.id !== excludeReservationId && BLOCKING_STATUSES.has(r.status) && rangesOverlap(arrival, departure, r.arrival, r.departure),
  );
  if (blockedByReservation) return false;
  return !ooo.some((w) => rangesOverlap(arrival, departure, w.fromDate, w.toDate));
}
