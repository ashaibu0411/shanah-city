import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { signInForCommunityScreenshots } from "./helpers/community-screenshot-auth";

const artifactDir = path.join(process.cwd(), "docs/premium-home-v2-screenshots");
const baselineDir = path.join(process.cwd(), "docs/premium-home-v4-screenshots");
const IGNORABLE_CONSOLE =
  /favicon|third-party|chrome-extension|Failed to load resource.*(401|404|503)|youtube|facebook|google-analytics/i;

const needsFixture = process.env.PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES === "1";
test.skip(!needsFixture, "Requires synthetic QA fixture (PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES=1)");

test.describe("Premium Home V2 mobile screenshots (signed-in)", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactDir, { recursive: true });
  });

  for (const vp of [
    { width: 390, height: 844, tag: "390x844" },
    { width: 430, height: 932, tag: "430x932" },
  ]) {
    test(`home premium v2 signed-in ${vp.tag}`, async ({ page }) => {
      if (!process.env.PLAYWRIGHT_COMMUNITY_EMAIL || !process.env.PLAYWRIGHT_COMMUNITY_PASSWORD) {
        throw new Error("Provide synthetic QA credentials.");
      }

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
      expect(await signInForCommunityScreenshots(page)).toBe(true);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".premium-home-v2", { timeout: 90_000 });
      await page.waitForFunction(() => document.body.classList.contains("premium-home-v2-active"));
      await expect(page.locator(".ph4-hero--editorial")).toBeVisible();

      await page.waitForFunction(
        () => {
          const imgs = Array.from(document.querySelectorAll(".premium-home-v2 img")) as HTMLImageElement[];
          return imgs.length >= 6 && imgs.every((img) => img.complete && img.naturalWidth > 0);
        },
        undefined,
        { timeout: 60_000 },
      );

      const storiesRail = page.locator(".premium-stories--home-v2 .community-portrait-story-card");
      await expect
        .poll(() => storiesRail.count(), { timeout: 90_000 })
        .toBeGreaterThanOrEqual(1);
      await expect(page.locator(".premium-stories__guest")).toHaveCount(0);

      await page.waitForFunction(() => {
        const doc = document.documentElement;
        return doc.scrollWidth <= doc.clientWidth + 1;
      });

      const density = await page.evaluate(() => {
        const top = window.innerHeight;
        const nodes = [
          ".ph4-hero",
          ".ph4-tile-grid",
          ".ph4-give",
          ".ph4-events",
        ];
        let visibleBlocks = 0;
        for (const sel of nodes) {
          const el = document.querySelector(sel);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (rect.top < top && rect.bottom > 0) visibleBlocks += 1;
        }
        const tiles = document.querySelectorAll(".ph4-tile").length;
        return { visibleBlocks, tiles, viewport: top };
      });
      expect(density.visibleBlocks).toBeGreaterThanOrEqual(2);
      expect(density.tiles).toBe(4);

      expect([...pageErrors, ...consoleErrors]).toEqual([]);

      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.screenshot({
        path: path.join(artifactDir, `premium-home-v2-full-mobile-${vp.tag}.png`),
        fullPage: true,
      });
      await page.screenshot({
        path: path.join(artifactDir, `premium-home-v2-viewport-${vp.tag}.png`),
        fullPage: false,
      });

      await page.locator(".mobile-app-header").screenshot({
        path: path.join(artifactDir, `premium-home-v2-header-${vp.tag}.png`),
      });
      await page.locator(".ph4-hero--editorial").screenshot({
        path: path.join(artifactDir, `premium-home-v2-hero-${vp.tag}.png`),
      });
      await page.locator(".ph4-tile-grid").screenshot({
        path: path.join(artifactDir, `premium-home-v2-tiles-${vp.tag}.png`),
      });
      await page.locator(".ph4-give").screenshot({
        path: path.join(artifactDir, `premium-home-v2-give-${vp.tag}.png`),
      });

      const events = page.locator(".ph4-events").first();
      if (await events.count()) {
        await events.scrollIntoViewIfNeeded();
        await events.screenshot({
          path: path.join(artifactDir, `premium-home-v2-events-${vp.tag}.png`),
        });
      }

      const sermon = page.locator(".ph4-sermon").first();
      if (await sermon.count()) {
        await sermon.scrollIntoViewIfNeeded();
        await sermon.screenshot({
          path: path.join(artifactDir, `premium-home-v2-sermon-${vp.tag}.png`),
        });
      }

      const stories = page.locator(".premium-stories--home-v2").first();
      await stories.scrollIntoViewIfNeeded();
      await stories.screenshot({
        path: path.join(artifactDir, `premium-home-v2-stories-signed-in-${vp.tag}.png`),
      });

      const community = page.locator(".ph4-community").first();
      if (await community.count()) {
        await community.scrollIntoViewIfNeeded();
        await community.screenshot({
          path: path.join(artifactDir, `premium-home-v2-community-${vp.tag}.png`),
        });
      }

      const lower = page.locator(".premium-guest-cta");
      if (await lower.count()) {
        await lower.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: path.join(artifactDir, `premium-home-v2-lower-${vp.tag}.png`),
          clip: (await lower.boundingBox()) ?? undefined,
        });
      }

      if (fs.existsSync(path.join(baselineDir, `premium-home-v4-390x844-full.png`))) {
        fs.copyFileSync(
          path.join(baselineDir, `premium-home-v4-${vp.tag}-full.png`),
          path.join(artifactDir, `baseline-v4-full-mobile-${vp.tag}.png`),
        );
      }
    });
  }
});
