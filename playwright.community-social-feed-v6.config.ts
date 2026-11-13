import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  testMatch: "community-social-feed-v6.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3021",
    ...devices["Pixel 5"],
    locale: "en-US",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
