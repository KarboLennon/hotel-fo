"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";
import { ok, fail, zodFail, type ActionResult } from "@/lib/action-result";
import { guestSchema, type GuestInput } from "@/lib/validation/guest";
import { toGuestInput, guestData, type GuestSummary } from "@/server/queries/guests";

export async function searchGuests(q: string): Promise<GuestSummary[]> {
  await requireUser();
  const term = q.trim();
  if (term.length < 2) return [];
  try {
    const guests = await db.guest.findMany({
      where: { OR: [{ lastName: { contains: term, mode: "insensitive" } }, { firstName: { contains: term, mode: "insensitive" } }, { idNumber: { contains: term } }, { phone: { contains: term } }, { email: { contains: term, mode: "insensitive" } }] },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }], take: 20,
    });
    return guests.map(toGuestInput);
  } catch {
    return [];
  }
}

export async function saveGuest(raw: GuestInput, id?: string): Promise<ActionResult<{ id: string }>> {
  await requireUser();
  const parsed = guestSchema.safeParse(raw);
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const g = id ? await db.guest.update({ where: { id }, data: guestData(parsed.data) }) : await db.guest.create({ data: guestData(parsed.data) });
    revalidatePath("/guests");
    return ok({ id: g.id });
  } catch {
    return fail("Gagal menyimpan tamu");
  }
}

export async function deleteGuest(id: string): Promise<ActionResult> {
  await requireUser();
  try {
    await db.$transaction(async (tx) => {
      const count = await tx.reservation.count({ where: { guestId: id } });
      if (count > 0) throw new Error("Tamu punya riwayat reservasi, tidak bisa dihapus");
      await tx.guest.delete({ where: { id } });
    });
    revalidatePath("/guests");
    return ok(null);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal menghapus tamu");
  }
}
