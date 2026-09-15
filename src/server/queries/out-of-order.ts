import { db } from "@/server/db";
import { isOooActive } from "@/server/services/room-status";

export async function listOutOfOrder() {
  const rows = await db.outOfOrder.findMany({ include: { room: { include: { roomType: true } } }, orderBy: [{ fromDate: "desc" }] });
  const today = new Date();
  return rows.map((r) => ({ id: r.id, createdAt: r.createdAt, fromDate: r.fromDate, toDate: r.toDate, roomNumber: r.room.number, roomTypeName: r.room.roomType.name, remark: r.remark, active: isOooActive(r, today) }));
}
export type OooRow = Awaited<ReturnType<typeof listOutOfOrder>>[number];

export async function getRoomsForSelect() {
  const rooms = await db.room.findMany({ include: { roomType: true } });
  return rooms.sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0)).map((r) => ({ id: r.id, number: r.number, typeName: r.roomType.name }));
}
