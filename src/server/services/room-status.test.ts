import { describe, it, expect } from "vitest";
import { deriveRoomStatus, matchesFilter, type ReservationWindow } from "./room-status";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const today = d(2023, 12, 16);
const res = (status: ReservationWindow["status"], from: Date, to: Date): ReservationWindow => ({ id: "r", status, arrival: from, departure: to });

describe("deriveRoomStatus", () => {
  it("vacant when nothing", () => {
    expect(deriveRoomStatus({ isDirty: false }, [], [], today)).toEqual({ status: "VACANT", isDirty: false, isDueOut: false, current: undefined });
  });
  it("out of order wins over occupied", () => {
    const s = deriveRoomStatus({ isDirty: false }, [res("CHECKED_IN", d(2023, 12, 15), d(2023, 12, 17))], [{ fromDate: d(2023, 12, 16), toDate: null }], today);
    expect(s.status).toBe("OUT_OF_ORDER");
  });
  it("ooo ends the day of toDate (exclusive)", () => {
    const s = deriveRoomStatus({ isDirty: false }, [], [{ fromDate: d(2023, 12, 10), toDate: d(2023, 12, 16) }], today);
    expect(s.status).toBe("VACANT");
  });
  it("occupied by checked-in guest, due out on departure day", () => {
    const s = deriveRoomStatus({ isDirty: true }, [res("CHECKED_IN", d(2023, 12, 15), d(2023, 12, 16))], [], today);
    expect(s).toMatchObject({ status: "OCCUPIED", isDirty: true, isDueOut: true });
  });
  it("occupied stays occupied after departure day until checked out", () => {
    const s = deriveRoomStatus({ isDirty: false }, [res("CHECKED_IN", d(2023, 12, 10), d(2023, 12, 12))], [], today);
    expect(s.status).toBe("OCCUPIED");
  });
  it("reserved when a reservation covers the day", () => {
    const s = deriveRoomStatus({ isDirty: false }, [res("RESERVED", d(2023, 12, 16), d(2023, 12, 18))], [], today);
    expect(s.status).toBe("RESERVED");
    expect(s.current?.status).toBe("RESERVED");
  });
  it("ignores cancelled, void, no-show, checked-out", () => {
    for (const st of ["CANCELLED", "VOID", "NO_SHOW", "CHECKED_OUT"] as const) {
      expect(deriveRoomStatus({ isDirty: false }, [res(st, d(2023, 12, 16), d(2023, 12, 18))], [], today).status).toBe("VACANT");
    }
  });
});

describe("matchesFilter", () => {
  const occDue = { status: "OCCUPIED" as const, isDirty: true, isDueOut: true };
  it("ALL always true", () => expect(matchesFilter(occDue, "ALL")).toBe(true));
  it("DIRTY and DUE_OUT use flags", () => {
    expect(matchesFilter(occDue, "DIRTY")).toBe(true);
    expect(matchesFilter(occDue, "DUE_OUT")).toBe(true);
    expect(matchesFilter({ status: "VACANT", isDirty: false, isDueOut: false }, "DIRTY")).toBe(false);
  });
  it("status filters compare status", () => {
    expect(matchesFilter(occDue, "OCCUPIED")).toBe(true);
    expect(matchesFilter(occDue, "VACANT")).toBe(false);
  });
});
