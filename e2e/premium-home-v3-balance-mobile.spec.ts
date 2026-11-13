import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const artifactDir = path.join(process.cwd(), "docs/premium-home-v3-balance-screenshots");
const IGNORABLE_CONSOLE =
  /favicon|third-party|chrome-extension|Failed to load resource.*(401|404|503)|youtube|facebook|google-analytics/i;

const VIEWPORTS = [
  { width: 360, height: 800, tag: "360x800" },
  { width: 390, height: 844, tag: "390x844" },
  { width: 412, height: 915, tag: "412x915" },
  { width: 430, height: 932, tag: "430x932" },
] as const;

test.describe("Premium Home V3 mobile vertical balance", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactDir, { recursive: true });
  });

  for (const vp of VIEWPORTS) {
    test(`balance layout ${vp.tag}`, async ({ page }) => {
      page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        if (IGNORABLE_CONSOLE.test(msg.text())) return;
      });

      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".premium-home-v3", { timeout: 90_000 });
      await page.waitForFunction(() => document.body.classList.contains("premium-home-v3-active"));

      await expect(page.locator(".premium-home-v3__balance-lower")).toBeVisible();
      await expect(page.locator(".ph4-hero--v3")).toBeVisible();

      const heroBox = await page.locator(".ph4-hero--v3").boundingBox();
      const lowerBox = await page.locator(".premium-home-v3__balance-lower").boundingBox();
      const navBox = await page.locator(".mobile-bottom-nav").boundingBox();
      expect(heroBox).not.toBeNull();
      expect(lowerBox).not.toBeNull();
      expect(navBox).not.toBeNull();
      expect(heroBox!.height).toBeGreaterThan(vp.height * 0.14);
      expect(lowerBox!.y + lowerBox!.height).toBeLessThanOrEqual(navBox!.y + 4);

      await page.waitForFunction(() => {
        const doc = document.documentElement;
        return doc.scrollWidth <= doc.clientWidth + 1;
      });

      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.screenshot({
        path: path.join(artifactDir, `premium-home-v3-balance-viewport-${vp.tag}.png`),
        fullPage: false,
      });
      await page.screenshot({
        path: path.join(artifactDir, `premium-home-v3-balance-full-${vp.tag}.png`),
        fullPage: true,
      });

      await page.locator(".ph4-hero--v3").screenshot({
        path: path.join(artifactDir, `premium-home-v3-balance-hero-${vp.tag}.png`),
      });
      await page.locator(".ph4-section:has(.ph4-sermon)").screenshot({
        path: path.join(artifactDir, `premium-home-v3-balance-sermon-${vp.tag}.png`),
      });
      await page.locator(".premium-home-v3__balance-lower").screenshot({
        path: path.join(artifactDir, `premium-home-v3-balance-lower-${vp.tag}.png`),
      });
    });
  }
});
