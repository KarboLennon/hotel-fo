import type { Guest, Prisma } from "@prisma/client";
import type { GuestInput } from "@/lib/validation/guest";
import { toDateInput } from "@/lib/format";
import { db } from "@/server/db";

export type GuestSummary = GuestInput & { id: string };

export function toGuestInput(g: Guest): GuestSummary {
  return {
    id: g.id, title: g.title, firstName: g.firstName, lastName: g.lastName, address: g.address, city: g.city, postal: g.postal, country: g.country,
    email: g.email, phone: g.phone ?? "", idType: g.idType, idNumber: g.idNumber, idExpMonth: g.idExpMonth ?? undefined, idExpYear: g.idExpYear ?? undefined,
    idLifetime: g.idLifetime, nationality: g.nationality, state: g.state, birthDate: g.birthDate ? toDateInput(g.birthDate) : "",
    birthCity: g.birthCity, birthState: g.birthState ?? "", birthCountry: g.birthCountry ?? "", gender: g.gender ?? "", guestType: g.guestType,
    occupation: g.occupation ?? "", photoUrl: g.photoUrl ?? "",
  };
}

/** GuestInput → Prisma create/update data. Single definition, used by reservation and guest actions. */
export function guestData(g: GuestInput) {
  return {
    title: g.title, firstName: g.firstName, lastName: g.lastName, address: g.address, city: g.city, postal: g.postal, country: g.country,
    email: g.email, phone: g.phone || null, idType: g.idType, idNumber: g.idNumber,
    idExpMonth: g.idLifetime ? null : g.idExpMonth ?? null, idExpYear: g.idLifetime ? null : g.idExpYear ?? null, idLifetime: g.idLifetime,
    nationality: g.nationality, state: g.state, birthDate: g.birthDate ? new Date(g.birthDate) : null,
    birthCity: g.birthCity, birthState: g.birthState || null, birthCountry: g.birthCountry || null,
    gender: g.gender || null, guestType: g.guestType, occupation: g.occupation || null, photoUrl: g.photoUrl || null,
  };
}

export interface GuestQuery { lastName?: string; firstName?: string; idNumber?: string; phone?: string; inHouseOnly?: boolean }

export async function listGuests(q: GuestQuery) {
  const where: Prisma.GuestWhereInput = {
    AND: [
      q.lastName ? { lastName: { contains: q.lastName, mode: "insensitive" } } : {},
      q.firstName ? { firstName: { contains: q.firstName, mode: "insensitive" } } : {},
      q.idNumber ? { idNumber: { contains: q.idNumber } } : {},
      q.phone ? { phone: { contains: q.phone } } : {},
      q.inHouseOnly ? { reservations: { some: { status: "CHECKED_IN" } } } : {},
    ],
  };
  const rows = await db.guest.findMany({ where, include: { reservations: { orderBy: { createdAt: "desc" }, take: 1, include: { source: true, marketPlace: true } } }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }], take: 500 });
  return rows.map((g) => ({ id: g.id, guestType: g.guestType, name: `${g.firstName} ${g.lastName}`, country: g.country, source: g.reservations[0]?.source?.name ?? g.reservations[0]?.marketPlace.name ?? "", email: g.email, city: g.city, phone: g.phone ?? "" }));
}
export type GuestListRow = Awaited<ReturnType<typeof listGuests>>[number];

export async function getGuest(id: string) {
  const g = await db.guest.findUnique({ where: { id } });
  return g ? toGuestInput(g) : null;
}
