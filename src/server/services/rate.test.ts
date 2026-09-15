import { describe, it, expect } from "vitest";
import { calculateRate } from "./rate";

describe("calculateRate", () => {
  it("room charge × nights plus tax", () => {
    const r = calculateRate({ ratePerNight: 520, nights: 1, taxPercent: 21 });
    expect(r).toEqual({ roomCharge: 520, tax: 109.2, extra: 0, total: 629.2, paid: 0, balance: 629.2 });
  });
  it("adds extras and special requests, subtracts payments", () => {
    const r = calculateRate({ ratePerNight: 100, nights: 2, taxPercent: 10, extras: [30], specialRequests: [{ price: 150, qty: 2 }], payments: [200] });
    expect(r.roomCharge).toBe(200);
    expect(r.extra).toBe(330);
    expect(r.tax).toBe(20);
    expect(r.total).toBe(550);
    expect(r.paid).toBe(200);
    expect(r.balance).toBe(350);
  });
  it("rounds to cents", () => {
    const r = calculateRate({ ratePerNight: 33.333, nights: 3, taxPercent: 7.5 });
    expect(r.roomCharge).toBe(100);
    expect(r.tax).toBe(7.5);
  });
});
