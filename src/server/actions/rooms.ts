"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";
import { ok, fail, type ActionResult } from "@/lib/action-result";

export async function markRoomClean(roomId: string): Promise<ActionResult> {
  await requireUser();
  const room = await db.room.findUnique({ where: { id: roomId } });
  if (!room) return fail("Kamar tidak ditemukan");
  await db.room.update({ where: { id: roomId }, data: { isDirty: false } });
  revalidatePath("/");
  return ok(null);
}
