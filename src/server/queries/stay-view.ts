import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import { db } from "@/server/db";
import type { ReservationStatus } from "@/lib/constants";

export interface StayBar { reservationId: string; status: ReservationStatus; guestName: string; startIdx: number; endIdx: number }

export async function getStayView(start: Date, days: number) {
  const from = startOfDay(start);
  const to = addDays(from, days);
  const rooms = await db.room.findMany({
    include: {
      roomType: true,
      reservations: {
        where: { status: { in: ["RESERVED", "CHECKED_IN"] }, arrival: { lt: to }, OR: [{ status: "CHECKED_IN" }, { departure: { gt: from } }] },
        include: { guest: true },
      },
    },
  });
  return {
    rooms: rooms
      .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0))
      .map((room) => ({
        id: room.id, number: room.number, typeName: room.roomType.name,
        bars: room.reservations.flatMap((r): StayBar[] => {
          const startIdx = Math.max(0, differenceInCalendarDays(r.arrival, from));
          let endIdx = Math.min(days, differenceInCalendarDays(r.departure, from));
          if (r.status === "CHECKED_IN" && endIdx <= startIdx) endIdx = Math.min(days, startIdx + 1);
          if (endIdx <= startIdx) return [];
          return [{ reservationId: r.id, status: r.status, guestName: `${r.guest.firstName} ${r.guest.lastName}`, startIdx, endIdx }];
        }),
      })),
  };
}
