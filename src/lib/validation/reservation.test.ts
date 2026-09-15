import { describe, it, expect } from "vitest";
import { reservationSchema } from "./reservation";

const guest = {
  title: "MR", firstName: "Swapnil", lastName: "Shinde", address: "Jl. A", city: "Jakarta", postal: "10270", country: "Indonesia",
  email: "s@x.com", idType: "KTP", idNumber: "123", idLifetime: true, nationality: "Indonesia", state: "DKI", birthCity: "Jakarta", guestType: "REGULAR",
};
const base = {
  guest, arrivalDate: "2023-12-16", arrivalTime: "14:00", departureDate: "2023-12-17", departureTime: "12:00", nights: 1,
  adults: 2, children: 0, infants: 0, roomTypeId: "rt", roomId: "r", rateTypeId: "rate", marketPlaceId: "mp",
  settlementMethod: "CASH", specialRequests: [],
};

describe("reservationSchema", () => {
  it("accepts a valid reservation", () => expect(reservationSchema.safeParse(base).success).toBe(true));
  it("rejects departure before arrival", () => {
    const r = reservationSchema.safeParse({ ...base, departureDate: "2023-12-16", departureTime: "10:00" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["departureDate"]);
  });
  it("requires ID expiry unless lifetime", () => {
    const r = reservationSchema.safeParse({ ...base, guest: { ...guest, idLifetime: false } });
    expect(r.success).toBe(false);
    expect(r.error?.issues.some((i) => i.path.join(".") === "guest.idExpMonth")).toBe(true);
  });
  it("requires card type for credit", () => {
    const r = reservationSchema.safeParse({ ...base, settlementMethod: "CREDIT" });
    expect(r.success).toBe(false);
  });
});
