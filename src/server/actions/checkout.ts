"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";
import { ok, fail, zodFail, type ActionResult } from "@/lib/action-result";
import { nextStatus, InvalidTransitionError } from "@/server/services/status";
import { round2 } from "@/server/services/rate";

const lineSchema = z.object({ kind: z.enum(["PAYMENT", "DEPOSIT", "EXTRA"]), amount: z.number().positive("Jumlah harus > 0"), description: z.string().trim().min(1, "Keterangan wajib") });

class BalanceNotZeroError extends Error {
  constructor(public balance: number) { super("Balance not zero"); }
}

export async function addFolioLine(reservationId: string, raw: z.infer<typeof lineSchema>): Promise<ActionResult> {
  await requireUser();
  const parsed = lineSchema.safeParse(raw);
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const r = await db.reservation.findUnique({ where: { id: reservationId }, include: { folio: true } });
    if (!r?.folio) return fail("Folio tidak ditemukan");
    if (r.status !== "RESERVED" && r.status !== "CHECKED_IN") return fail("Reservasi sudah ditutup");
    const signed = parsed.data.kind === "EXTRA" ? parsed.data.amount : -parsed.data.amount;
    await db.folioLine.create({ data: { folioId: r.folio.id, kind: parsed.data.kind, description: parsed.data.description, amount: round2(signed) } });
    revalidatePath(`/reservations/${reservationId}`); revalidatePath(`/reservations/${reservationId}/checkout`); revalidatePath("/guest-ledger"); revalidatePath("/");
    return ok(null);
  } catch {
    return fail("Gagal menyimpan pembayaran");
  }
}

export async function settleReservation(id: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const r = await db.reservation.findUnique({ where: { id }, include: { folio: true } });
    if (!r?.folio) return fail("Reservasi tidak ditemukan");
    let status;
    try { status = nextStatus(r.status, "CHECK_OUT"); } catch (e) { return fail(e instanceof InvalidTransitionError ? e.message : "Transisi tidak valid"); }

    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Reservation" WHERE "id" = ${id} FOR UPDATE`;
      const lines = await tx.folioLine.findMany({ where: { folioId: r.folio!.id } });
      const balance = round2(lines.reduce((s, l) => s + Number(l.amount), 0));
      if (Math.abs(balance) >= 0.005) throw new BalanceNotZeroError(balance);
      await tx.reservation.update({ where: { id }, data: { status, checkedOutById: user.id, checkedOutAt: new Date() } });
      await tx.room.update({ where: { id: r.roomId }, data: { isDirty: true } });
    });
    revalidatePath("/"); revalidatePath("/reservations"); revalidatePath(`/reservations/${id}`); revalidatePath("/guest-ledger");
    return ok(null);
  } catch (e) {
    if (e instanceof BalanceNotZeroError) return fail(`Balance masih ${e.balance.toFixed(2)}. Lunasi dulu sebelum check out.`);
    return fail("Gagal memproses check out");
  }
}
