import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const artifactDir = path.join(process.cwd(), "docs/premium-home-v4-screenshots");

test.describe("Premium Home V4 mobile screenshots", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactDir, { recursive: true });
  });

  test("home at 390x844 and 430x932", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector(".premium-home-v4", { timeout: 90_000 });
    await expect(page.locator(".ph4-hero__title")).toHaveText("Shanah City");
    await expect(page.locator(".ph4-tile-grid")).toBeVisible();

    await page.screenshot({
      path: path.join(artifactDir, "premium-home-v4-390x844-viewport.png"),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(artifactDir, "premium-home-v4-390x844-full.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector(".premium-home-v4");
    await page.screenshot({
      path: path.join(artifactDir, "premium-home-v4-430x932-viewport.png"),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(artifactDir, "premium-home-v4-430x932-full.png"),
      fullPage: true,
    });
  });
});
