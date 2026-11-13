import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  testMatch: "premium-home-v3-balance-mobile.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3020",
    ...devices["Pixel 5"],
    locale: "en-US",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
