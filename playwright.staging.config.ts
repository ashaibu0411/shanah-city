import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "scripts",
  testMatch: ["_staging-marriage-hub-regression.spec.ts"],
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "https://shanah-city-staging.vercel.app",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
