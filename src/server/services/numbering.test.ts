import { describe, it, expect } from "vitest";
import { formatReservationNumber, formatFolioNumber, parseReservationNumber } from "./numbering";

describe("numbering", () => {
  it("pads to 4 digits", () => {
    expect(formatReservationNumber(1)).toBe("RESN0001");
    expect(formatFolioNumber(12)).toBe("F0012");
  });
  it("grows past 9999", () => { expect(formatReservationNumber(12345)).toBe("RESN12345"); });
  it("parses back", () => {
    expect(parseReservationNumber("resn0007")).toBe(7);
    expect(parseReservationNumber("hello")).toBeNull();
  });
});
