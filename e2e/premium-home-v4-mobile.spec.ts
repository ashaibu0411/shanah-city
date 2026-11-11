import { test, expect } from "@playwright/test";

test.describe("Premium Home V4 mobile screenshots", () => {
  test("home at 390x844 and 430x932", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector(".premium-home-v4", { timeout: 90_000 });
    await expect(page.locator(".ph4-hero__title")).toHaveText("Shanah City");
    await page.screenshot({ path: "test-results/premium-home-v4-390x844.png", fullPage: true });

    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto("/");
    await page.waitForSelector(".premium-home-v4");
    await page.screenshot({ path: "test-results/premium-home-v4-430x932.png", fullPage: true });
  });
});
