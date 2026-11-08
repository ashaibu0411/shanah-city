import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "scripts",
  testMatch: ["story-music-clip-timeline-webkit.spec.ts"],
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [["list"]],
  projects: [{ name: "webkit-iphone", use: { ...devices["iPhone 13"] } }],
});
