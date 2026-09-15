import { describe, it, expect } from "vitest";
import { parseStay, pickAvailableRoom, countAvailable, makeVoucherNumber } from "./booking";

const times = { checkIn: "14:00", checkOut: "12:00" };
const today = new Date(2023, 11, 16, 9, 0);
const d = (day: number) => new Date(2023, 11, day);

describe("parseStay", () => {
  it("accepts a valid future stay and applies hotel times", () => {
    const r = parseStay("2023-12-20", "2023-12-22", times, today);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.stay.nights).toBe(2);
      expect(r.stay.arrival).toEqual(new Date(2023, 11, 20, 14, 0));
      expect(r.stay.departure).toEqual(new Date(2023, 11, 22, 12, 0));
    }
  });
  it("allows arrival today", () => expect(parseStay("2023-12-16", "2023-12-17", times, today).ok).toBe(true));
  it("rejects past arrival", () => expect(parseStay("2023-12-15", "2023-12-17", times, today)).toEqual({ ok: false, error: "ARRIVAL_IN_PAST" }));
  it("rejects departure not after arrival", () => expect(parseStay("2023-12-20", "2023-12-20", times, today)).toEqual({ ok: false, error: "DEPARTURE_NOT_AFTER_ARRIVAL" }));
  it("rejects garbage and very long stays", () => {
    expect(parseStay("nope", "2023-12-20", times, today)).toEqual({ ok: false, error: "INVALID_DATE" });
    expect(parseStay("2023-12-20", "2024-02-20", times, today)).toEqual({ ok: false, error: "TOO_LONG" });
  });
});

describe("pickAvailableRoom / countAvailable", () => {
  const busy = { id: "a", status: "RESERVED" as const, arrival: d(20), departure: d(22) };
  const candidates = [
    { room: "101", reservations: [busy], ooo: [] },
    { room: "102", reservations: [], ooo: [{ fromDate: d(19), toDate: null }] },
    { room: "103", reservations: [], ooo: [] },
    { room: "104", reservations: [], ooo: [] },
  ];
  it("skips booked and out-of-order rooms", () => {
    expect(pickAvailableRoom(candidates, d(20), d(21))).toBe("103");
    expect(countAvailable(candidates, d(20), d(21))).toBe(2);
  });
  it("returns null when nothing is free", () => {
    expect(pickAvailableRoom(candidates.slice(0, 2), d(20), d(21))).toBeNull();
  });
});

describe("makeVoucherNumber", () => {
  it("uses a 3-letter prefix from the source and a 6-char tail", () => {
    expect(makeVoucherNumber("Traveloka", () => 0)).toBe("TRA-AAAAAA");
    expect(makeVoucherNumber("Booking.com", () => 0.999)).toMatch(/^BOO-[A-Z2-9]{6}$/);
    expect(makeVoucherNumber("", () => 0)).toBe("WEB-AAAAAA");
  });
});
