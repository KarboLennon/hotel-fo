"use server";
import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";
import { logError } from "@/server/log";
import { ok, fail, zodFail, type ActionResult } from "@/lib/action-result";
import { outOfOrderSchema, type OutOfOrderInput } from "@/lib/validation/out-of-order";
import { combineDateTime } from "@/server/services/dates";
import { rangesOverlap } from "@/server/services/availability";

const paths = ["/", "/out-of-order"];

class ClashError extends Error {}
class OooClashError extends Error {}
class NotFoundError extends Error {}

export async function markOutOfOrder(raw: OutOfOrderInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = outOfOrderSchema.safeParse(raw);
  if (!parsed.success) return zodFail(parsed.error);
  const { roomId, remark } = parsed.data;
  const fromDate = combineDateTime(parsed.data.fromDate, "00:00");
  const toDate = parsed.data.toDate ? combineDateTime(parsed.data.toDate, "00:00") : null;

  try {
    await db.$transaction(async (tx) => {
      // Lock the room row so a concurrent reservation save and this O/O check serialize.
      await tx.$queryRaw`SELECT "id" FROM "Room" WHERE "id" = ${roomId} FOR UPDATE`;
      const room = await tx.room.findUnique({ where: { id: roomId } });
      if (!room) throw new NotFoundError();
      const until = toDate ?? new Date(8640000000000000);
      const active = await tx.reservation.findMany({ where: { roomId, status: { in: ["RESERVED", "CHECKED_IN"] } }, select: { arrival: true, departure: true, status: true } });
      const clash = active.find((r) => rangesOverlap(fromDate, until, r.arrival, r.status === "CHECKED_IN" ? null : r.departure));
      if (clash) throw new ClashError();
      const existing = await tx.outOfOrder.findMany({ where: { roomId }, select: { fromDate: true, toDate: true } });
      if (existing.some((o) => rangesOverlap(fromDate, until, o.fromDate, o.toDate))) throw new OooClashError();
      await tx.outOfOrder.create({ data: { roomId, fromDate, toDate, remark, createdById: user.id } });
    });
  } catch (e) {
    if (e instanceof NotFoundError) return fail("Kamar tidak ditemukan");
    if (e instanceof ClashError) return fail("Kamar punya reservasi aktif pada rentang tanggal tersebut", { roomId: ["Ada reservasi aktif"] });
    if (e instanceof OooClashError) return fail("Kamar sudah out of order pada rentang tersebut", { roomId: ["Sudah out of order"] });
    logError("markOutOfOrder", e);
    return fail("Gagal menyimpan out of order");
  }
  paths.forEach((p) => revalidatePath(p));
  return ok(null);
}

export async function unmarkOutOfOrder(id: string): Promise<ActionResult> {
  await requireUser();
  try {
    const row = await db.outOfOrder.findUnique({ where: { id } });
    if (!row) return fail("Data tidak ditemukan");
    const today = startOfDay(new Date());
    await db.outOfOrder.update({ where: { id }, data: { toDate: row.fromDate > today ? row.fromDate : today } });
  } catch (e) {
    logError("unmarkOutOfOrder", e);
    return fail("Gagal mengubah data out of order");
  }
  paths.forEach((p) => revalidatePath(p));
  return ok(null);
}
