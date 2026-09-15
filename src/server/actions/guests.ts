"use server";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";
import { toGuestInput, type GuestSummary } from "@/server/queries/guests";

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
