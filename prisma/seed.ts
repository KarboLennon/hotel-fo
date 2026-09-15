import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

function adminPassword(): string {
  const fromEnv = process.env.ADMIN_PASSWORD;
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") throw new Error("ADMIN_PASSWORD is required");
  return "admin123";
}

async function main() {
  // Compute (and validate) the admin password before writing anything, so a misconfigured
  // production environment fails fast instead of partially seeding.
  const passwordHash = await bcrypt.hash(adminPassword(), 10);

  await db.setting.createMany({
    data: [
      { key: "taxPercent", value: "21" },
      { key: "checkInTime", value: "14:00" },
      { key: "checkOutTime", value: "12:00" },
    ],
    skipDuplicates: true,
  });

  const [superDeluxe, kingSuite, presidential] = await Promise.all([
    db.roomType.upsert({ where: { name: "Super Deluxe" }, update: {}, create: { name: "Super Deluxe", baseRate: 365 } }),
    db.roomType.upsert({ where: { name: "King Suite" }, update: {}, create: { name: "King Suite", baseRate: 520 } }),
    db.roomType.upsert({ where: { name: "Presidential" }, update: {}, create: { name: "Presidential", baseRate: 1100 } }),
  ]);

  const rooms: { number: string; floor: string; roomTypeId: string }[] = [];
  for (let i = 101; i <= 109; i++) rooms.push({ number: String(i), floor: "Ground Floor", roomTypeId: superDeluxe.id });
  for (let i = 1001; i <= 1009; i++) rooms.push({ number: String(i), floor: "First Floor", roomTypeId: kingSuite.id });
  for (let i = 2001; i <= 2008; i++) rooms.push({ number: String(i), floor: "First Floor", roomTypeId: presidential.id });
  await db.room.createMany({ data: rooms, skipDuplicates: true });

  const rateTypeNames = ["Daily", "Weekday", "Weekend", "Continental Plan", "American Plan"];
  const multipliers: Record<string, number> = { Daily: 1, Weekday: 0.9, Weekend: 1.15, "Continental Plan": 1.1, "American Plan": 1.25 };
  for (const name of rateTypeNames) {
    const rt = await db.rateType.upsert({ where: { name }, update: {}, create: { name } });
    for (const roomType of [superDeluxe, kingSuite, presidential]) {
      await db.rateTypeRoomTypeRate.upsert({
        where: { rateTypeId_roomTypeId: { rateTypeId: rt.id, roomTypeId: roomType.id } },
        update: {},
        create: { rateTypeId: rt.id, roomTypeId: roomType.id, rate: Number(roomType.baseRate) * multipliers[name] },
      });
    }
  }

  for (const [name, requiresSource] of [["Domestic", false], ["Walk In", false], ["Taxi", false], ["Travel Agent", true]] as const) {
    await db.marketPlace.upsert({ where: { name }, update: {}, create: { name, requiresSource } });
  }
  for (const name of ["Traveloka", "Tiket.com", "Booking.com", "Agoda"]) {
    await db.source.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const [name, price] of [["Extra Bed", 150], ["Hair Dryer", 0], ["Baby Cot", 50]] as const) {
    await db.specialRequestItem.upsert({ where: { name }, update: {}, create: { name, price } });
  }

  await db.user.upsert({
    where: { email: "admin@hotel.local" }, update: { passwordHash },
    create: { name: "Admin", email: "admin@hotel.local", role: "ADMIN", passwordHash },
  });
  // Demo receptionist with a well-known password: development and e2e only.
  if (process.env.NODE_ENV !== "production") {
    await db.user.upsert({
      where: { email: "fo@hotel.local" }, update: {},
      create: { name: "Front Desk", email: "fo@hotel.local", role: "RECEPTIONIST", passwordHash: await bcrypt.hash("fo12345", 10) },
    });
  }
  console.log("seed done");
}

main().finally(() => db.$disconnect());
