import { defineConfig, devices } from "@playwright/test";

/** Opt-in synthetic staging fixture review. Never connect to a production account. */
export default defineConfig({
  testDir: "e2e",
  testMatch: "premium-v4-community-populated.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
