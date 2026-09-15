import { startOfDay } from "date-fns";
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
): DerivedRoomState {
  const day = t(date);
  const checkedIn = reservations.find((r) => r.status === "CHECKED_IN" && t(r.arrival) <= day);
  const isDueOut = !!checkedIn && t(checkedIn.departure) <= day;

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
