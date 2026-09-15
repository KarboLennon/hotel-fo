import { z } from "zod";

const req = (msg = "Wajib diisi") => z.string().trim().min(1, msg);
const opt = z.string().trim().optional();

export const guestSchema = z.object({
  title: z.enum(["MR", "MRS", "DR", "MISS"]),
  firstName: req(), lastName: req(),
  address: req(), city: req(), postal: req(), country: req(),
  email: z.email("Email tidak valid"),
  phone: opt,
  idType: z.enum(["KTP", "SIM", "PASSPORT"]),
  idNumber: req(),
  idExpMonth: z.number().int().min(1).max(12).optional(),
  idExpYear: z.number().int().min(2000).max(2100).optional(),
  idLifetime: z.boolean(),
  nationality: req(), state: req(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  birthCity: req(), birthState: opt, birthCountry: opt,
  gender: z.enum(["MALE", "FEMALE"]).optional().or(z.literal("")),
  guestType: z.enum(["REGULAR", "REPEAT", "VIP"]),
  occupation: opt, photoUrl: opt,
}).superRefine((g, ctx) => {
  if (!g.idLifetime && (!g.idExpMonth || !g.idExpYear)) {
    ctx.addIssue({ code: "custom", path: ["idExpMonth"], message: "Isi masa berlaku ID atau centang Lifetime" });
  }
});
export type GuestInput = z.infer<typeof guestSchema>;
