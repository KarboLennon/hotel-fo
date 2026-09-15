"use server";
import { revalidatePath } from "next/cache";
import { addDays, format } from "date-fns";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { nextStatus, InvalidTransitionError, type ReservationAction } from "@/server/services/status";
import { isRoomAvailable } from "@/server/services/availability";
import { calculateRate } from "@/server/services/rate";
import { getSettings } from "@/server/queries/options";

class RoomUnavailableError extends Error {}

export async function transitionReservation(id: string, action: Exclude<ReservationAction, "CHECK_OUT">): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const r = await db.reservation.findUnique({ where: { id }, include: { folio: true, specialRequests: { include: { item: true } } } });
    if (!r) return fail("Reservasi tidak ditemukan");
    let status;
    try { status = nextStatus(r.status, action); } catch (e) { return fail(e instanceof InvalidTransitionError ? e.message : "Transisi tidak valid"); }

    if (action !== "CHECK_IN") {
      await db.reservation.update({ where: { id }, data: { status } });
      revalidatePath("/"); revalidatePath("/reservations"); revalidatePath(`/reservations/${id}`);
      return ok(null);
    }

    if (!r.folio) return fail("Folio tidak ditemukan");
    const settings = await getSettings();
    const rate = calculateRate({ ratePerNight: Number(r.ratePerNight), nights: r.nights, taxPercent: settings.taxPercent });
    const now = new Date();
    const lines = [
      ...Array.from({ length: r.nights }, (_, i) => ({ kind: "ROOM_CHARGE" as const, description: `Room charge ${format(addDays(r.arrival, i), "dd MMM yyyy")}`, amount: Number(r.ratePerNight), date: now })),
      { kind: "TAX" as const, description: `Tax ${settings.taxPercent}%`, amount: rate.tax, date: now },
      ...r.specialRequests.map((s) => ({ kind: "SPECIAL_REQUEST" as const, description: `${s.item.name} × ${s.qty}`, amount: Number(s.item.price) * s.qty, date: now })),
    ];

    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Room" WHERE "id" = ${r.roomId} FOR UPDATE`;
      const [others, ooo] = await Promise.all([
        tx.reservation.findMany({ where: { roomId: r.roomId, status: { in: ["RESERVED", "CHECKED_IN"] } }, select: { id: true, status: true, arrival: true, departure: true } }),
        tx.outOfOrder.findMany({ where: { roomId: r.roomId }, select: { fromDate: true, toDate: true } }),
      ]);
      if (!isRoomAvailable(r.arrival, r.departure, others, ooo, r.id)) throw new RoomUnavailableError();

      await tx.folioLine.createMany({ data: lines.map((l) => ({ ...l, folioId: r.folio!.id })) });
      await tx.reservation.update({ where: { id }, data: { status, checkedInById: user.id, checkedInAt: now } });
    });
    revalidatePath("/"); revalidatePath("/reservations"); revalidatePath(`/reservations/${id}`); revalidatePath("/guest-ledger");
    return ok(null);
  } catch (e) {
    if (e instanceof RoomUnavailableError) return fail("Kamar tidak tersedia untuk check-in (bentrok reservasi lain atau out of order)");
    return fail("Gagal memproses reservasi");
  }
}
