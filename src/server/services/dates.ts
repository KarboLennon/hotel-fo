import { addDays, differenceInCalendarDays, isSameDay, set, startOfDay } from "date-fns";

export interface HHMM { hour: number; minute: number }

export function parseTime(hhmm: string): HHMM {
  const [h, m] = hhmm.split(":").map(Number);
  return { hour: h || 0, minute: m || 0 };
}

export function dayStart(d: Date): Date { return startOfDay(d); }

export function departureFromNights(arrival: Date, nights: number, checkOut: HHMM): Date {
  const day = addDays(startOfDay(arrival), Math.max(1, Math.floor(nights)));
  return set(day, { hours: checkOut.hour, minutes: checkOut.minute, seconds: 0, milliseconds: 0 });
}

export function nightsFromDates(arrival: Date, departure: Date): number {
  return Math.max(1, differenceInCalendarDays(startOfDay(departure), startOfDay(arrival)));
}

export function combineDateTime(dateStr: string, timeStr: string): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const { hour, minute } = parseTime(timeStr);
  return new Date(y, mo - 1, d, hour, minute, 0, 0);
}

export function sameDay(a: Date, b: Date): boolean { return isSameDay(a, b); }
