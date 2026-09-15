import { addDays, startOfDay } from "date-fns";
import type { ReservationStatus, RoomStatus, StatusFilter } from "@/lib/constants";

export interface ReservationWindow { id: string; status: ReservationStatus; arrival: Date; departure: Date }
export interface OooWindow { fromDate: Date; toDate: Date | null }
export interface DerivedRoomState { status: RoomStatus; isDirty: boolean; isDueOut: boolean; current?: ReservationWindow }

const t = (d: Date) => startOfDay(d).getTime();

export function isOooActive(w: OooWindow, day: Date): boolean {
  const x = t(day);
  return t(w.fromDate) <= x && (w.toDate === null || x < t(w.toDate));
}

export function deriveRoomStatus(
  room: { isDirty: boolean },
  reservations: ReservationWindow[],
  ooo: OooWindow[],
  date: Date,
  today: Date = date,
): DerivedRoomState {
  const day = t(date);
  const now = t(today);
  // A checked-in stay occupies the room through its departure day (exclusive). An
  // overstaying guest keeps the room until they are checked out, so the window is
  // extended to the end of today — but never onto future dates past the departure.
  const until = (r: ReservationWindow) => Math.max(t(r.departure), t(addDays(today, 1)));
  const checkedIn = reservations.find((r) => r.status === "CHECKED_IN" && t(r.arrival) <= day && day < until(r));
  const isDueOut = !!checkedIn && t(checkedIn.departure) <= now && day === now;

  if (ooo.some((w) => isOooActive(w, date))) {
    return { status: "OUT_OF_ORDER", isDirty: room.isDirty, isDueOut, current: checkedIn };
  }
  if (checkedIn) return { status: "OCCUPIED", isDirty: room.isDirty, isDueOut, current: checkedIn };

  const reserved = reservations.find((r) => r.status === "RESERVED" && t(r.arrival) <= day && day < t(r.departure));
  if (reserved) return { status: "RESERVED", isDirty: room.isDirty, isDueOut: false, current: reserved };

  return { status: "VACANT", isDirty: room.isDirty, isDueOut: false, current: undefined };
}

export function matchesFilter(state: Pick<DerivedRoomState, "status" | "isDirty" | "isDueOut">, filter: StatusFilter): boolean {
  switch (filter) {
    case "ALL": return true;
    case "DIRTY": return state.isDirty;
    case "DUE_OUT": return state.isDueOut;
    default: return state.status === filter;
  }
}
