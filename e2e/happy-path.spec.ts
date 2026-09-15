import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const stamp = Date.now().toString().slice(-6);
let roomNumber = "";

test("login → reserve → check in → check out → ledger", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "admin@hotel.local");
  await page.fill("#password", "admin123");
  await page.click("button[type=submit]");
  await expect(page.getByRole("heading", { name: "Room View" })).toBeVisible();

  // pick the first vacant room card (link to /reservations/new)
  const vacant = page.locator('a[href^="/fo/reservations/new"]').first();
  roomNumber = (await vacant.locator(".display").first().textContent())!.trim();
  await vacant.click();
  await expect(page.getByRole("heading", { name: new RegExp(`Room ${roomNumber}`) })).toBeVisible();

  await page.fill('input[name="guest.lastName"]', `E2E${stamp}`);
  await page.fill('input[name="guest.firstName"]', "Test");
  await page.fill('input[name="guest.address"]', "Jl. Test 1");
  await page.fill('input[name="guest.city"]', "Jakarta");
  await page.fill('input[name="guest.postal"]', "10270");
  await page.fill('input[name="guest.state"]', "DKI");
  await page.fill('input[name="guest.email"]', `e2e${stamp}@test.local`);
  await page.fill('input[name="guest.idNumber"]', `ID${stamp}`);
  await page.check('input[name="guest.idLifetime"]');
  await page.fill('input[name="guest.birthCity"]', "Jakarta");
  await page.click('button:has-text("Reserve")');

  await expect(page).toHaveURL(/\/reservations\/[a-z0-9]+$/);
  await expect(page.getByText("Reserved", { exact: true })).toBeVisible();

  await page.click('button:has-text("Check In")');
  await expect(page.getByText("Checked In", { exact: true })).toBeVisible();

  await page.click('a[href$="/checkout"] button');
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByText(/Check Out ·/)).toBeVisible();
  await page.click('button:has-text("Add")');
  await expect(page.locator("tfoot")).toContainText("Rp 0");
  await page.click('button:has-text("Settle & Check Out")');
  await expect(page.getByText("Checked Out", { exact: true })).toBeVisible();

  await page.goto("/fo/guest-ledger?lookingFor=checkedout");
  await expect(page.getByText(`Test E2E${stamp}`)).toBeVisible();

  await page.goto("/fo");
  const card = page
    .locator("div.relative")
    .filter({ has: page.locator(".display", { hasText: new RegExp(`^${roomNumber}$`) }) })
    .first();
  await expect(card.getByRole("button", { name: "Mark clean" })).toBeVisible();
});

test.afterAll(async () => {
  const prisma = new PrismaClient();
  try {
    try {
      const guests = await prisma.guest.findMany({ where: { lastName: { startsWith: "E2E" } } });
      const guestIds = guests.map((g) => g.id);
      if (guestIds.length) {
        const reservations = await prisma.reservation.findMany({ where: { guestId: { in: guestIds } } });
        const reservationIds = reservations.map((r) => r.id);
        if (reservationIds.length) {
          await prisma.folioLine.deleteMany({ where: { folio: { reservationId: { in: reservationIds } } } });
          await prisma.folio.deleteMany({ where: { reservationId: { in: reservationIds } } });
          await prisma.reservation.deleteMany({ where: { id: { in: reservationIds } } });
        }
        await prisma.guest.deleteMany({ where: { id: { in: guestIds } } });
      }
      if (roomNumber) {
        await prisma.room.updateMany({ where: { number: roomNumber }, data: { isDirty: false } });
      }
    } catch (err) {
      console.warn("e2e cleanup failed:", err);
    }
  } finally {
    await prisma.$disconnect();
  }
});
