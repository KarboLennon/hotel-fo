import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { addDays, format } from "date-fns";

const stamp = Date.now().toString().slice(-6);

test("guest books online → confirmation shows RESN number → visible in Front Office", async ({ page }) => {
  const arrival = format(addDays(new Date(), 20), "yyyy-MM-dd");
  const departure = format(addDays(new Date(), 22), "yyyy-MM-dd");

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Ketenangan yang terasa/ })).toBeVisible();
  await page.getByLabel("Check-in").fill(arrival);
  await page.getByLabel("Check-out").fill(departure);
  await page.getByLabel("Sumber booking").selectOption({ label: "Traveloka" });
  await page.getByRole("button", { name: "Cari Kamar" }).click();

  await expect(page.getByRole("heading", { name: "Pilih kamar" })).toBeVisible();
  await page.getByRole("link", { name: "Pilih" }).first().click();

  await expect(page.getByRole("heading", { level: 1, name: /Data tamu/ })).toBeVisible();
  await page.fill('input[name="firstName"]', "Online");
  await page.fill('input[name="lastName"]', `E2E${stamp}`);
  await page.fill('input[name="email"]', `online${stamp}@test.local`);
  await page.fill('input[name="phone"]', "0812000000");
  await page.fill('input[name="address"]', "Jl. Web 1");
  await page.fill('input[name="city"]', "Tangerang");
  await page.fill('input[name="state"]', "Banten");
  await page.fill('input[name="postal"]', "15310");
  await page.fill('input[name="idNumber"]', `WEB${stamp}`);
  await page.fill('input[name="birthCity"]', "Tangerang");
  await page.getByLabel("Kartu kredit").check();
  await page.selectOption('select[name="cardType"]', "VISA");
  await page.fill('input[name="cardNumber"]', "4111 1111 1111 1111");
  await page.fill('input[name="cardExpiry"]', "09/28");
  await page.getByRole("button", { name: "Booking sekarang" }).click();

  await expect(page).toHaveURL(/\/book\/confirmation\/[a-z0-9]+$/);
  await expect(page.locator("p.display", { hasText: /^RESN\d+$/ })).toBeVisible();
  await expect(page.getByText("Traveloka · Voucher TRA-")).toBeVisible();
  await expect(page.getByText("Kartu kredit VISA **** 1111")).toBeVisible();

  // The reservation is visible to the receptionist
  await page.goto("/login");
  await page.fill("#email", "admin@hotel.local");
  await page.fill("#password", "admin123");
  await page.click("button[type=submit]");
  await expect(page).toHaveURL(/\/fo$/);
  await page.goto("/fo/reservations?q=E2E" + stamp);
  await expect(page.getByText(`E2E${stamp}`)).toBeVisible();
});

test.afterAll(async () => {
  const db = new PrismaClient();
  try {
    const guests = await db.guest.findMany({ where: { lastName: { startsWith: "E2E" } }, select: { id: true } });
    const ids = guests.map((g) => g.id);
    const reservations = await db.reservation.findMany({ where: { guestId: { in: ids } }, select: { id: true } });
    await db.reservation.deleteMany({ where: { id: { in: reservations.map((r) => r.id) } } });
    await db.guest.deleteMany({ where: { id: { in: ids } } });
  } catch (e) {
    console.warn("public-booking cleanup skipped:", e);
  } finally {
    await db.$disconnect();
  }
});
