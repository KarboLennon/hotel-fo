"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";
import { logError } from "@/server/log";
import { ok, fail, zodFail, type ActionResult } from "@/lib/action-result";
import { guestMessageSchema, type GuestMessageInput } from "@/lib/validation/guest-message";

export async function saveGuestMessage(raw: GuestMessageInput, id?: string): Promise<ActionResult<{ id: string }>> {
  await requireUser();
  const parsed = guestMessageSchema.safeParse(raw);
  if (!parsed.success) return zodFail(parsed.error);
  const data = { ...parsed.data, company: parsed.data.company || null, phone: parsed.data.phone || null };
  try {
    let needsCheck = true;
    if (id) {
      const existing = await db.guestMessage.findUnique({ where: { id } });
      if (!existing) return fail("Pesan tidak ditemukan");
      needsCheck = existing.guestId !== data.guestId || existing.roomId !== data.roomId;
    }
    if (needsCheck) {
      const inHouse = await db.reservation.findFirst({ where: { guestId: data.guestId, roomId: data.roomId, status: "CHECKED_IN" } });
      if (!inHouse) return fail("Tamu tidak sedang menginap di kamar tersebut", { guestId: ["Pilih tamu in-house"] });
    }
    const m = id ? await db.guestMessage.update({ where: { id }, data }) : await db.guestMessage.create({ data });
    revalidatePath("/guest-messages");
    return ok({ id: m.id });
  } catch (e) {
    logError("saveGuestMessage", e);
    return fail("Gagal menyimpan pesan");
  }
}

export async function deleteGuestMessage(id: string): Promise<ActionResult> {
  await requireUser();
  try {
    const m = await db.guestMessage.findUnique({ where: { id } });
    if (!m) return fail("Pesan tidak ditemukan");
    await db.guestMessage.delete({ where: { id } });
    revalidatePath("/guest-messages");
    return ok(null);
  } catch (e) {
    logError("deleteGuestMessage", e);
    return fail("Gagal menghapus pesan");
  }
}
