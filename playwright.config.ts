import { defineConfig } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  // Specs share one dev database and one dev server (which compiles routes on first hit): run them serially.
  workers: 1,
  expect: { timeout: 15_000 },
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  webServer: { command: "npm run dev", url: "http://localhost:3000/login", reuseExistingServer: true, timeout: 120_000 },
});
