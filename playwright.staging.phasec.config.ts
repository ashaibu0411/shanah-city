import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "scripts",
  testMatch: [
    "_staging-marriage-hub-regression.spec.ts",
    "_staging-marriage-phasec-acceptance.spec.ts",
  ],
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: ".tmp-staging-phasec-playwright.json" }]],
  use: {
    baseURL: "https://shanah-city-staging.vercel.app",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 5"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
});
