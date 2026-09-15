"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";
import { logError } from "@/server/log";
import { ok, fail, type ActionResult } from "@/lib/action-result";

export async function markRoomClean(roomId: string): Promise<ActionResult> {
  await requireUser();
  try {
    const room = await db.room.findUnique({ where: { id: roomId } });
    if (!room) return fail("Kamar tidak ditemukan");
    await db.room.update({ where: { id: roomId }, data: { isDirty: false } });
    revalidatePath("/fo");
    return ok(null);
  } catch (e) {
    logError("markRoomClean", e);
    return fail("Gagal memperbarui status kamar");
  }
}
