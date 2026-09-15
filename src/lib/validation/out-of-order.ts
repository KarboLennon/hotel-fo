import { z } from "zod";
export const outOfOrderSchema = z.object({
  roomId: z.string().min(1, "Pilih kamar"),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  remark: z.string().trim().min(1, "Remark wajib diisi"),
}).refine((v) => !v.toDate || v.toDate > v.fromDate, { path: ["toDate"], message: "Tanggal selesai harus setelah mulai" });
export type OutOfOrderInput = z.infer<typeof outOfOrderSchema>;
