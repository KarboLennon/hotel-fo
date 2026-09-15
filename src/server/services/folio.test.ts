import { describe, it, expect } from "vitest";
import { buildCheckInLines } from "./folio";
import { calculateRate } from "./rate";

const arrival = new Date(2023, 11, 16, 14, 0);
const base = { arrival, nights: 3, ratePerNight: 365, taxPercent: 21, specialRequests: [] };

describe("buildCheckInLines", () => {
  it("writes one room charge per night with consecutive dates", () => {
    const lines = buildCheckInLines(base);
    const room = lines.filter((l) => l.kind === "ROOM_CHARGE");
    expect(room).toHaveLength(3);
    expect(room.map((l) => l.description)).toEqual([
      "Room charge 16 Dec 2023",
      "Room charge 17 Dec 2023",
      "Room charge 18 Dec 2023",
    ]);
    expect(room.every((l) => l.amount === 365)).toBe(true);
  });

  it("writes one tax line matching calculateRate", () => {
    const lines = buildCheckInLines(base);
    const tax = lines.filter((l) => l.kind === "TAX");
    expect(tax).toHaveLength(1);
    expect(tax[0].description).toBe("Tax 21%");
    expect(tax[0].amount).toBe(calculateRate({ ratePerNight: 365, nights: 3, taxPercent: 21 }).tax);
  });

  it("writes one special request line per item at price × qty", () => {
    const lines = buildCheckInLines({
      ...base,
      specialRequests: [{ name: "Extra Bed", price: 150, qty: 2 }, { name: "Baby Cot", price: 50, qty: 1 }],
    });
    const sr = lines.filter((l) => l.kind === "SPECIAL_REQUEST");
    expect(sr).toEqual([
      { kind: "SPECIAL_REQUEST", description: "Extra Bed × 2", amount: 300 },
      { kind: "SPECIAL_REQUEST", description: "Baby Cot × 1", amount: 50 },
    ]);
  });

  it("keeps every amount positive (charges, not payments)", () => {
    const lines = buildCheckInLines({ ...base, specialRequests: [{ name: "Extra Bed", price: 150, qty: 2 }] });
    expect(lines.every((l) => l.amount > 0)).toBe(true);
  });

  it("emits only room charges and tax when there is no special request", () => {
    const lines = buildCheckInLines({ ...base, nights: 1 });
    expect(lines).toEqual([
      { kind: "ROOM_CHARGE", description: "Room charge 16 Dec 2023", amount: 365 },
      { kind: "TAX", description: "Tax 21%", amount: 76.65 },
    ]);
  });
});
