import { describe, it, expect } from "vitest";
import { rangesOverlap, isRoomAvailable } from "./availability";

const d = (day: number, h = 0) => new Date(2023, 11, day, h);

describe("rangesOverlap (half-open by day)", () => {
  it("back-to-back does not overlap", () => expect(rangesOverlap(d(16), d(18), d(18), d(20))).toBe(false));
  it("shared night overlaps", () => expect(rangesOverlap(d(16), d(18), d(17), d(20))).toBe(true));
  it("ignores time of day", () => expect(rangesOverlap(d(16, 23), d(18, 1), d(18, 0), d(19))).toBe(false));
  it("open-ended end overlaps everything after start", () => expect(rangesOverlap(d(16), d(18), d(17), null)).toBe(true));
});

describe("isRoomAvailable", () => {
  const active = [{ id: "a", status: "RESERVED" as const, arrival: d(17), departure: d(19) }];
  it("blocked by active reservation", () => expect(isRoomAvailable(d(16), d(18), active, [])).toBe(false));
  it("free when excluding the same reservation (edit)", () => expect(isRoomAvailable(d(16), d(18), active, [], "a")).toBe(true));
  it("blocked by out of order", () => expect(isRoomAvailable(d(16), d(18), [], [{ fromDate: d(17), toDate: null }])).toBe(false));
  it("cancelled reservations do not block", () => {
    expect(isRoomAvailable(d(16), d(18), [{ id: "c", status: "CANCELLED", arrival: d(16), departure: d(18) }], [])).toBe(true);
  });
});
