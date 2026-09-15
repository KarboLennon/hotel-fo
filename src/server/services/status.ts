import type { ReservationStatus } from "@/lib/constants";

export type ReservationAction = "CHECK_IN" | "CHECK_OUT" | "CANCEL" | "NO_SHOW" | "VOID";

const TRANSITIONS: Record<ReservationStatus, Partial<Record<ReservationAction, ReservationStatus>>> = {
  RESERVED: { CHECK_IN: "CHECKED_IN", CANCEL: "CANCELLED", NO_SHOW: "NO_SHOW", VOID: "VOID" },
  CHECKED_IN: { CHECK_OUT: "CHECKED_OUT" },
  CHECKED_OUT: {},
  CANCELLED: {},
  NO_SHOW: {},
  VOID: {},
};

export class InvalidTransitionError extends Error {
  constructor(current: ReservationStatus, action: ReservationAction) {
    super(`Cannot ${action} a reservation that is ${current}`);
    this.name = "InvalidTransitionError";
  }
}

export function nextStatus(current: ReservationStatus, action: ReservationAction): ReservationStatus {
  const next = TRANSITIONS[current][action];
  if (!next) throw new InvalidTransitionError(current, action);
  return next;
}

export function availableActions(current: ReservationStatus): ReservationAction[] {
  return Object.keys(TRANSITIONS[current]) as ReservationAction[];
}
