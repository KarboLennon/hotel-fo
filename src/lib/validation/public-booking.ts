import { z } from "zod";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid");
const req = (msg = "Wajib diisi") => z.string().trim().min(1, msg);

/** Query-string search from the landing page. `source` is "direct" or a Source id. */
export const bookingSearchSchema = z.object({
  arrival: dateStr,
  departure: dateStr,
  adults: z.coerce.number().int().min(1).max(6).default(2),
  children: z.coerce.number().int().min(0).max(4).default(0),
  source: z.string().trim().min(1).default("direct"),
});
export type BookingSearch = z.infer<typeof bookingSearchSchema>;

export const publicBookingSchema = z.object({
  arrival: dateStr,
  departure: dateStr,
  adults: z.number().int().min(1).max(6),
  children: z.number().int().min(0).max(4),
  source: z.string().trim().min(1),
  roomTypeId: req("Pilih tipe kamar"),
  title: z.enum(["MR", "MRS", "MISS", "DR"]),
  firstName: req(), lastName: req(),
  email: z.email("Email tidak valid"),
  phone: req("Nomor telepon wajib diisi"),
  address: req(), city: req(), postal: req(), country: req(), state: req(),
  nationality: req(),
  idType: z.enum(["KTP", "SIM", "PASSPORT"]),
  idNumber: req(),
  birthCity: req(),
  paymentMethod: z.enum(["CASH", "CREDIT"]),
  cardType: z.enum(["VISA", "MASTERCARD"]).optional().or(z.literal("")),
  cardNumber: z.string().trim().optional(),
  cardExpiry: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
}).superRefine((b, ctx) => {
  if (b.paymentMethod === "CREDIT") {
    if (!b.cardType) ctx.addIssue({ code: "custom", path: ["cardType"], message: "Pilih jenis kartu" });
    const digits = (b.cardNumber ?? "").replace(/\D/g, "");
    if (digits.length < 12 || digits.length > 19) ctx.addIssue({ code: "custom", path: ["cardNumber"], message: "Nomor kartu 12–19 digit" });
    if (!/^\d{2}\/\d{2}$/.test(b.cardExpiry ?? "")) ctx.addIssue({ code: "custom", path: ["cardExpiry"], message: "Format MM/YY" });
  }
});
export type PublicBookingInput = z.infer<typeof publicBookingSchema>;
