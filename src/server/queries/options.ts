import { db } from "@/server/db";

export async function getSettings() {
  const rows = await db.setting.findMany();
  const get = (k: string, d: string) => rows.find((r) => r.key === k)?.value ?? d;
  return { taxPercent: Number(get("taxPercent", "0")), checkInTime: get("checkInTime", "14:00"), checkOutTime: get("checkOutTime", "12:00") };
}

export async function getReservationOptions() {
  const [roomTypes, rateTypes, rates, marketPlaces, sources, items, settings] = await Promise.all([
    db.roomType.findMany({ orderBy: { name: "asc" }, include: { rooms: { orderBy: { number: "asc" } } } }),
    db.rateType.findMany({ orderBy: { name: "asc" } }),
    db.rateTypeRoomTypeRate.findMany(),
    db.marketPlace.findMany({ orderBy: { name: "asc" } }),
    db.source.findMany({ orderBy: { name: "asc" } }),
    db.specialRequestItem.findMany({ orderBy: { name: "asc" } }),
    getSettings(),
  ]);
  return {
    roomTypes: roomTypes.map((t) => ({ id: t.id, name: t.name, baseRate: Number(t.baseRate), rooms: t.rooms.map((r) => ({ id: r.id, number: r.number })) })),
    rateTypes: rateTypes.map((r) => ({ id: r.id, name: r.name })),
    rates: rates.map((r) => ({ rateTypeId: r.rateTypeId, roomTypeId: r.roomTypeId, rate: Number(r.rate) })),
    marketPlaces: marketPlaces.map((m) => ({ id: m.id, name: m.name, requiresSource: m.requiresSource })),
    sources: sources.map((s) => ({ id: s.id, name: s.name })),
    items: items.map((i) => ({ id: i.id, name: i.name, price: Number(i.price) })),
    settings,
  };
}
export type ReservationOptions = Awaited<ReturnType<typeof getReservationOptions>>;
