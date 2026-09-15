import type { Guest } from "@prisma/client";
import type { GuestInput } from "@/lib/validation/guest";
import { toDateInput } from "@/lib/format";

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
