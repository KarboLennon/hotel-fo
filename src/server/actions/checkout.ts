"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";
import { logError } from "@/server/log";
import { ok, fail, zodFail, type ActionResult } from "@/lib/action-result";
import { nextStatus, InvalidTransitionError } from "@/server/services/status";
import { round2 } from "@/server/services/rate";

const lineSchema = z.object({ kind: z.enum(["PAYMENT", "DEPOSIT", "EXTRA"]), amount: z.number().positive("Jumlah harus > 0"), description: z.string().trim().min(1, "Keterangan wajib") });

class BalanceNotZeroError extends Error {
  constructor(public balance: number) { super("Balance not zero"); }
}

class NotFoundError extends Error {
  constructor() { super("Not found"); }
}

class ClosedError extends Error {
  constructor() { super("Closed"); }
}

export async function addFolioLine(reservationId: string, raw: z.infer<typeof lineSchema>): Promise<ActionResult> {
  await requireUser();
  const parsed = lineSchema.safeParse(raw);
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const signed = parsed.data.kind === "EXTRA" ? parsed.data.amount : -parsed.data.amount;
    await db.$transaction(async (tx) => {
      // Project lock order: Room → Reservation. This path never touches Room, so taking
      // only the Reservation lock is safe — it is the same row lock settleReservation
      // takes second, so a concurrent settle and a concurrent folio write serialize
      // instead of racing on the folio balance.
      await tx.$queryRaw`SELECT "id" FROM "Reservation" WHERE "id" = ${reservationId} FOR UPDATE`;
      const r = await tx.reservation.findUnique({ where: { id: reservationId }, include: { folio: true } });
      if (!r?.folio) throw new NotFoundError();
      if (r.status !== "RESERVED" && r.status !== "CHECKED_IN") throw new ClosedError();
      await tx.folioLine.create({ data: { folioId: r.folio.id, kind: parsed.data.kind, description: parsed.data.description, amount: round2(signed) } });
    });
    revalidatePath(`/fo/reservations/${reservationId}`); revalidatePath(`/fo/reservations/${reservationId}/checkout`); revalidatePath("/fo/guest-ledger"); revalidatePath("/fo");
    return ok(null);
  } catch (e) {
    if (e instanceof NotFoundError) return fail("Folio tidak ditemukan");
    if (e instanceof ClosedError) return fail("Reservasi sudah ditutup");
    logError("addFolioLine", e);
    return fail("Gagal menyimpan pembayaran");
  }
}

export async function settleReservation(id: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await db.$transaction(async (tx) => {
      const head = await tx.reservation.findUnique({ where: { id }, select: { roomId: true } });
      if (!head) throw new NotFoundError();
      // Project lock order: Room → Reservation. This settle updates both rows, so it takes
      // the room lock first and only then the reservation row; the status/balance check
      // below and the updates are then atomic against any concurrent settle or folio write.
      await tx.$queryRaw`SELECT "id" FROM "Room" WHERE "id" = ${head.roomId} FOR UPDATE`;
      await tx.$queryRaw`SELECT "id" FROM "Reservation" WHERE "id" = ${id} FOR UPDATE`;
      const r = await tx.reservation.findUnique({ where: { id }, include: { folio: { include: { lines: true } } } });
      if (!r?.folio) throw new NotFoundError();
      const status = nextStatus(r.status, "CHECK_OUT");
      const balance = round2(r.folio.lines.reduce((s, l) => s + Number(l.amount), 0));
      if (Math.abs(balance) >= 0.005) throw new BalanceNotZeroError(balance);
      await tx.reservation.update({ where: { id }, data: { status, checkedOutById: user.id, checkedOutAt: new Date() } });
      await tx.room.update({ where: { id: r.roomId }, data: { isDirty: true } });
    });
    revalidatePath("/fo"); revalidatePath("/fo/reservations"); revalidatePath(`/fo/reservations/${id}`); revalidatePath("/fo/guest-ledger");
    return ok(null);
  } catch (e) {
    if (e instanceof NotFoundError) return fail("Reservasi tidak ditemukan");
    if (e instanceof InvalidTransitionError) return fail(e.message);
    if (e instanceof BalanceNotZeroError) return fail(`Balance masih ${e.balance.toFixed(2)}. Lunasi dulu sebelum check out.`);
    logError("settleReservation", e);
    return fail("Gagal memproses check out");
  }
}
