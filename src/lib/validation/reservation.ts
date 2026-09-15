import { z } from "zod";
import { guestSchema } from "./guest";
import { combineDateTime } from "@/server/services/dates";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid");
const timeStr = z.string().regex(/^\d{2}:\d{2}$/, "Jam tidak valid");

export const reservationSchema = z.object({
  guestId: z.string().optional(),
  guest: guestSchema,
  arrivalDate: dateStr, arrivalTime: timeStr,
  departureDate: dateStr, departureTime: timeStr,
  nights: z.number().int().min(1, "Minimal 1 malam"),
  adults: z.number().int().min(1, "Minimal 1 dewasa"),
  children: z.number().int().min(0),
  infants: z.number().int().min(0),
  roomTypeId: z.string().min(1, "Pilih room type"),
  roomId: z.string().min(1, "Pilih kamar"),
  rateTypeId: z.string().min(1, "Pilih rate type"),
  marketPlaceId: z.string().min(1, "Pilih market place"),
  sourceId: z.string().optional(),
  settlementMethod: z.enum(["CASH", "CREDIT"]),
  cardType: z.enum(["CASH", "VISA", "MASTERCARD"]).optional().or(z.literal("")),
  cardNumber: z.string().trim().optional(),
  cardExpiry: z.string().trim().optional(),
  voucherNo: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  specialRequests: z.array(z.object({ itemId: z.string().min(1, "Pilih item"), qty: z.number().int().min(1) })),
}).superRefine((r, ctx) => {
  if (combineDateTime(r.departureDate, r.departureTime) <= combineDateTime(r.arrivalDate, r.arrivalTime)) {
    ctx.addIssue({ code: "custom", path: ["departureDate"], message: "Departure harus setelah arrival" });
  }
  if (r.settlementMethod === "CREDIT" && (!r.cardType || r.cardType === "CASH")) {
    ctx.addIssue({ code: "custom", path: ["cardType"], message: "Pilih tipe kartu" });
  }
  const seen = new Set<string>();
  r.specialRequests.forEach((s, i) => {
    if (seen.has(s.itemId)) ctx.addIssue({ code: "custom", path: ["specialRequests", i, "itemId"], message: "Item duplikat" });
    seen.add(s.itemId);
  });
});
export type ReservationInput = z.infer<typeof reservationSchema>;
