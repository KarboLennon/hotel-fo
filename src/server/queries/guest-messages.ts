import { db } from "@/server/db";

export async function listGuestMessages(undeliveredOnly: boolean) {
  const rows = await db.guestMessage.findMany({ where: undeliveredOnly ? { delivered: false } : {}, include: { room: true, guest: true }, orderBy: { createdAt: "desc" } });
  return rows.map((m) => ({
    id: m.id, roomNumber: m.room.number, firstName: m.guest.firstName, lastName: m.guest.lastName, fromName: m.fromName, message: m.message,
    company: m.company ?? "", phone: m.phone ?? "", createdAt: m.createdAt, delivered: m.delivered,
    input: { guestId: m.guestId, roomId: m.roomId, fromName: m.fromName, company: m.company ?? "", phone: m.phone ?? "", message: m.message,
      telephoned: m.telephoned, returnedYourCall: m.returnedYourCall, pleaseCall: m.pleaseCall, willCallAgain: m.willCallAgain,
      cameToSeeYou: m.cameToSeeYou, wantToSeeYou: m.wantToSeeYou, rush: m.rush, special: m.special, delivered: m.delivered },
  }));
}
export type GuestMessageRow = Awaited<ReturnType<typeof listGuestMessages>>[number];

export async function getInHouseGuests() {
  const rows = await db.reservation.findMany({ where: { status: "CHECKED_IN" }, include: { guest: true, room: true }, orderBy: { room: { number: "asc" } } });
  return rows.map((r) => ({ reservationId: r.id, guestId: r.guestId, roomId: r.roomId, roomNumber: r.room.number, firstName: r.guest.firstName, lastName: r.guest.lastName }));
}
