import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "scripts",
  testMatch: ["community-story-voice-e2e.spec.ts"],
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  reporter: [["list"]],
  use: {
    baseURL: process.env.STORY_E2E_BASE_URL ?? "https://shanah-city-staging.vercel.app",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
