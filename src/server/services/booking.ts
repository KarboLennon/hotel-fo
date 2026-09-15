import { differenceInCalendarDays, isValid, parseISO, startOfDay } from "date-fns";
import { combineDateTime, nightsFromDates } from "./dates";
import { isRoomAvailable } from "./availability";
import type { OooWindow, ReservationWindow } from "./room-status";

export const MAX_BOOKING_NIGHTS = 30;

export interface Stay { arrival: Date; departure: Date; nights: number }

export type StayError = "INVALID_DATE" | "ARRIVAL_IN_PAST" | "DEPARTURE_NOT_AFTER_ARRIVAL" | "TOO_LONG";

/** Validates a guest-entered date pair (yyyy-MM-dd) and returns the stay with hotel check-in/out times applied. */
export function parseStay(
  arrivalStr: string, departureStr: string, times: { checkIn: string; checkOut: string }, today: Date = new Date(),
): { ok: true; stay: Stay } | { ok: false; error: StayError } {
  const a = parseISO(arrivalStr);
  const d = parseISO(departureStr);
  if (!isValid(a) || !isValid(d)) return { ok: false, error: "INVALID_DATE" };
  if (differenceInCalendarDays(startOfDay(a), startOfDay(today)) < 0) return { ok: false, error: "ARRIVAL_IN_PAST" };
  const nights = differenceInCalendarDays(startOfDay(d), startOfDay(a));
  if (nights < 1) return { ok: false, error: "DEPARTURE_NOT_AFTER_ARRIVAL" };
  if (nights > MAX_BOOKING_NIGHTS) return { ok: false, error: "TOO_LONG" };
  const arrival = combineDateTime(arrivalStr, times.checkIn);
  const departure = combineDateTime(departureStr, times.checkOut);
  return { ok: true, stay: { arrival, departure, nights: nightsFromDates(arrival, departure) } };
}

export interface RoomCandidate<T = unknown> { room: T; reservations: ReservationWindow[]; ooo: OooWindow[] }

/** First room (in the given order) that is free for the whole stay, or null. */
export function pickAvailableRoom<T>(candidates: RoomCandidate<T>[], arrival: Date, departure: Date): T | null {
  const hit = candidates.find((c) => isRoomAvailable(arrival, departure, c.reservations, c.ooo));
  return hit ? hit.room : null;
}

/** How many of the candidates are free for the whole stay. */
export function countAvailable<T>(candidates: RoomCandidate<T>[], arrival: Date, departure: Date): number {
  return candidates.filter((c) => isRoomAvailable(arrival, departure, c.reservations, c.ooo)).length;
}

/** OTA-style voucher number, e.g. TRV-8K2Q4Z. Deterministic prefix per source name, random tail. */
export function makeVoucherNumber(sourceName: string, random: () => number = Math.random): string {
  const prefix = sourceName.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "WEB";
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tail = "";
  for (let i = 0; i < 6; i++) tail += alphabet[Math.floor(random() * alphabet.length)];
  return `${prefix}-${tail}`;
}
