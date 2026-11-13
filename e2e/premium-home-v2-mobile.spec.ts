import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const artifactDir = path.join(process.cwd(), "docs/premium-home-v2-screenshots");
const IGNORABLE_CONSOLE =
  /favicon|third-party|chrome-extension|Failed to load resource.*(401|503)|youtube|facebook|google-analytics/i;

test.describe("Premium Home V2 mobile screenshots", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactDir, { recursive: true });
  });

  for (const vp of [
    { width: 390, height: 844, tag: "390x844" },
    { width: 430, height: 932, tag: "430x932" },
  ]) {
    test(`home premium v2 ${vp.tag}`, async ({ page }) => {
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        const text = msg.text();
        if (IGNORABLE_CONSOLE.test(text)) return;
        consoleErrors.push(text);
      });

      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".premium-home-v2", { timeout: 90_000 });
      await page.waitForFunction(() => document.body.classList.contains("premium-home-v2-active"));

      await expect(page.locator(".ph4-hero__title")).toHaveText("Shanah City");
      await expect(page.locator(".ph4-tile-grid")).toBeVisible();

      await page.waitForFunction(
        () => {
          const imgs = Array.from(document.querySelectorAll(".premium-home-v2 img")) as HTMLImageElement[];
          return imgs.length >= 6 && imgs.every((img) => img.complete && img.naturalWidth > 0);
        },
        undefined,
        { timeout: 60_000 },
      );

      await page.waitForFunction(() => {
        const doc = document.documentElement;
        return doc.scrollWidth <= doc.clientWidth + 1;
      });

      expect([...pageErrors, ...consoleErrors]).toEqual([]);

      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.screenshot({
        path: path.join(artifactDir, `premium-home-v2-full-mobile-${vp.tag}.png`),
        fullPage: true,
      });

      await page.locator(".mobile-app-header").screenshot({
        path: path.join(artifactDir, `premium-home-v2-header-${vp.tag}.png`),
      });

      await page.locator(".ph4-hero").screenshot({
        path: path.join(artifactDir, `premium-home-v2-hero-${vp.tag}.png`),
      });

      await page.locator(".ph4-tile-grid").screenshot({
        path: path.join(artifactDir, `premium-home-v2-tiles-${vp.tag}.png`),
      });

      const events = page.locator(".ph4-events").first();
      if (await events.count()) {
        await events.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: path.join(artifactDir, `premium-home-v2-events-${vp.tag}.png`),
          clip: (await events.boundingBox()) ?? undefined,
        });
      }

      const stories = page.locator(".premium-stories").first();
      await stories.scrollIntoViewIfNeeded();
      await stories.screenshot({
        path: path.join(artifactDir, `premium-home-v2-stories-${vp.tag}.png`),
      });

      const sermon = page.locator(".ph4-sermon").first();
      if (await sermon.count()) {
        await sermon.scrollIntoViewIfNeeded();
        await sermon.screenshot({
          path: path.join(artifactDir, `premium-home-v2-sermon-${vp.tag}.png`),
        });
      }

      await page.screenshot({
        path: path.join(artifactDir, `premium-home-v2-viewport-${vp.tag}.png`),
        fullPage: false,
      });
    });
  }
});
