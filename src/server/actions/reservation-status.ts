"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { nextStatus, InvalidTransitionError, type ReservationAction } from "@/server/services/status";
import { isRoomAvailable } from "@/server/services/availability";
import { buildCheckInLines } from "@/server/services/folio";
import { getSettings } from "@/server/queries/options";

class RoomUnavailableError extends Error {}
class NotFoundError extends Error {}
class FolioMissingError extends Error {}

export async function transitionReservation(id: string, action: Exclude<ReservationAction, "CHECK_OUT">): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const settings = await getSettings();

    await db.$transaction(async (tx) => {
      const head = await tx.reservation.findUnique({ where: { id }, select: { roomId: true } });
      if (!head) throw new NotFoundError();

      // Project lock order: Room → Reservation. Every write path that touches both rows
      // (saveReservation, settleReservation, markOutOfOrder, this one) takes them in that
      // order, so concurrent transitions serialize instead of deadlocking.
      await tx.$queryRaw`SELECT "id" FROM "Room" WHERE "id" = ${head.roomId} FOR UPDATE`;
      await tx.$queryRaw`SELECT "id" FROM "Reservation" WHERE "id" = ${id} FOR UPDATE`;

      // Re-read under the lock: the status we decide on must be the committed one.
      const r = await tx.reservation.findUnique({
        where: { id },
        include: { folio: true, specialRequests: { include: { item: true } } },
      });
      if (!r) throw new NotFoundError();
      const status = nextStatus(r.status, action);

      if (action !== "CHECK_IN") {
        await tx.reservation.update({ where: { id }, data: { status } });
        return;
      }

      if (!r.folio) throw new FolioMissingError();
      const [others, ooo] = await Promise.all([
        tx.reservation.findMany({ where: { roomId: r.roomId, status: { in: ["RESERVED", "CHECKED_IN"] } }, select: { id: true, status: true, arrival: true, departure: true } }),
        tx.outOfOrder.findMany({ where: { roomId: r.roomId }, select: { fromDate: true, toDate: true } }),
      ]);
      if (!isRoomAvailable(r.arrival, r.departure, others, ooo, r.id)) throw new RoomUnavailableError();

      const now = new Date();
      const lines = buildCheckInLines({
        arrival: r.arrival, nights: r.nights, ratePerNight: Number(r.ratePerNight), taxPercent: settings.taxPercent,
        specialRequests: r.specialRequests.map((s) => ({ name: s.item.name, price: Number(s.item.price), qty: s.qty })),
      });
      await tx.folioLine.createMany({ data: lines.map((l) => ({ ...l, date: now, folioId: r.folio!.id })) });
      await tx.reservation.update({ where: { id }, data: { status, checkedInById: user.id, checkedInAt: now } });
    });

    revalidatePath("/"); revalidatePath("/reservations"); revalidatePath(`/reservations/${id}`); revalidatePath("/guest-ledger");
    return ok(null);
  } catch (e) {
    if (e instanceof NotFoundError) return fail("Reservasi tidak ditemukan");
    if (e instanceof FolioMissingError) return fail("Folio tidak ditemukan");
    if (e instanceof InvalidTransitionError) return fail(e.message);
    if (e instanceof RoomUnavailableError) return fail("Kamar tidak tersedia untuk check-in (bentrok reservasi lain atau out of order)");
    return fail("Gagal memproses reservasi");
  }
}
