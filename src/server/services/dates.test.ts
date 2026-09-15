import { describe, it, expect } from "vitest";
import { departureFromNights, nightsFromDates, parseTime, combineDateTime, sameDay } from "./dates";

describe("dates", () => {
  it("departure = arrival + nights at check-out time", () => {
    const arrival = new Date(2023, 11, 16, 15, 52);
    const dep = departureFromNights(arrival, 2, parseTime("12:00"));
    expect(dep).toEqual(new Date(2023, 11, 18, 12, 0));
  });
  it("nights minimum is 1", () => {
    const arrival = new Date(2023, 11, 16, 15, 52);
    expect(departureFromNights(arrival, 0, parseTime("12:00"))).toEqual(new Date(2023, 11, 17, 12, 0));
  });
  it("nights from dates uses calendar days", () => {
    expect(nightsFromDates(new Date(2023, 11, 16, 23, 0), new Date(2023, 11, 17, 1, 0))).toBe(1);
    expect(nightsFromDates(new Date(2023, 11, 16), new Date(2023, 11, 19))).toBe(3);
    expect(nightsFromDates(new Date(2023, 11, 16), new Date(2023, 11, 16))).toBe(1);
  });
  it("combineDateTime builds local datetime", () => {
    expect(combineDateTime("2023-12-16", "14:00")).toEqual(new Date(2023, 11, 16, 14, 0));
  });
  it("sameDay ignores time", () => {
    expect(sameDay(new Date(2023, 11, 16, 1), new Date(2023, 11, 16, 23))).toBe(true);
    expect(sameDay(new Date(2023, 11, 16), new Date(2023, 11, 17))).toBe(false);
  });
});
