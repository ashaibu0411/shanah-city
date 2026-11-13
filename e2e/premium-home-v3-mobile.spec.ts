import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { signInForCommunityScreenshots } from "./helpers/community-screenshot-auth";

const artifactDir = path.join(process.cwd(), "docs/premium-home-v3-screenshots");
const IGNORABLE_CONSOLE =
  /favicon|third-party|chrome-extension|Failed to load resource.*(401|404|503)|youtube|facebook|google-analytics/i;

test.describe("Premium Home V3 mobile screenshots (guest)", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactDir, { recursive: true });
  });

  for (const vp of [
    { width: 390, height: 844, tag: "390x844" },
    { width: 430, height: 932, tag: "430x932" },
  ]) {
    test(`home premium v3 guest ${vp.tag}`, async ({ page }) => {
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
      await page.waitForSelector(".premium-home-v3", { timeout: 90_000 });
      await page.waitForFunction(() => document.body.classList.contains("premium-home-v3-active"));
      await expect(page.locator(".ph4-community")).toHaveCount(0);
      await expect(page.locator(".ph4-hero--editorial")).toBeVisible();

      const storiesBox = await page.locator(".premium-stories--home-v3").first().boundingBox();
      const heroBox = await page.locator(".ph4-hero--editorial").boundingBox();
      expect(storiesBox).not.toBeNull();
      expect(heroBox).not.toBeNull();
      expect(storiesBox!.y).toBeLessThan(heroBox!.y);

      const navLabels = await page.locator(".mobile-bottom-nav .mobile-nav-label").allTextContents();
      expect(navLabels.map((l) => l.trim())).toEqual(["Home", "Devotions", "Media", "More"]);

      const tiles = page.locator(".ph4-tile__label");
      await expect(tiles.nth(0)).toHaveText("Worship Live");
      await expect(tiles.nth(3)).toHaveText("Get Connected");

      await page.waitForFunction(
        () => {
          const imgs = Array.from(document.querySelectorAll(".premium-home-v3 img")) as HTMLImageElement[];
          return imgs.length >= 5 && imgs.every((img) => img.complete && img.naturalWidth > 0);
        },
        undefined,
        { timeout: 60_000 },
      );

      expect([...pageErrors, ...consoleErrors]).toEqual([]);

      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.screenshot({
        path: path.join(artifactDir, `premium-home-v3-full-mobile-${vp.tag}.png`),
        fullPage: true,
      });
      await page.screenshot({
        path: path.join(artifactDir, `premium-home-v3-viewport-${vp.tag}.png`),
        fullPage: false,
      });

      await page.locator(".mobile-app-header").screenshot({
        path: path.join(artifactDir, `premium-home-v3-header-${vp.tag}.png`),
      });
      await page.locator(".premium-stories--home-v3").first().screenshot({
        path: path.join(artifactDir, `premium-home-v3-stories-${vp.tag}.png`),
      });
      await page.locator(".ph4-hero--editorial").screenshot({
        path: path.join(artifactDir, `premium-home-v3-hero-${vp.tag}.png`),
      });
      await page.locator(".ph4-tile-grid").screenshot({
        path: path.join(artifactDir, `premium-home-v3-tiles-${vp.tag}.png`),
      });
      await page.locator(".ph4-give").screenshot({
        path: path.join(artifactDir, `premium-home-v3-give-${vp.tag}.png`),
      });

      const events = page.locator(".ph4-events").first();
      if (await events.count()) {
        await events.scrollIntoViewIfNeeded();
        await events.screenshot({
          path: path.join(artifactDir, `premium-home-v3-events-${vp.tag}.png`),
        });
      }

      const sermon = page.locator(".ph4-sermon").first();
      if (await sermon.count()) {
        await sermon.scrollIntoViewIfNeeded();
        await sermon.screenshot({
          path: path.join(artifactDir, `premium-home-v3-sermon-${vp.tag}.png`),
        });
      }

      const checkIn = page.locator(".check-in-home-banner, [class*='check-in']").first();
      if (await checkIn.count()) {
        await checkIn.scrollIntoViewIfNeeded();
        await checkIn.screenshot({
          path: path.join(artifactDir, `premium-home-v3-checkin-${vp.tag}.png`),
        });
      }

      const lower = page.locator(".premium-guest-cta");
      if (await lower.count()) {
        await lower.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: path.join(artifactDir, `premium-home-v3-visitor-cta-${vp.tag}.png`),
          clip: (await lower.boundingBox()) ?? undefined,
        });
      }

      await page.locator(".mobile-bottom-nav").screenshot({
        path: path.join(artifactDir, `premium-home-v3-bottom-nav-${vp.tag}.png`),
      });
    });
  }
});

const needsFixture = process.env.PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES === "1";
test.describe("Premium Home V3 mobile screenshots (signed-in)", () => {
  test.skip(!needsFixture, "Requires synthetic QA fixture (PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES=1)");

  test("signed-in stories rail 390x844", async ({ page }) => {
    if (!process.env.PLAYWRIGHT_COMMUNITY_EMAIL || !process.env.PLAYWRIGHT_COMMUNITY_PASSWORD) {
      throw new Error("Provide synthetic QA credentials.");
    }
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await signInForCommunityScreenshots(page)).toBe(true);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".premium-home-v3", { timeout: 90_000 });
    await expect(page.locator(".community-portrait-story-card--reel")).toBeVisible();
    await expect(page.locator(".community-portrait-story-card--create")).toBeVisible();
    await page.locator(".premium-stories--home-v3").first().screenshot({
      path: path.join(artifactDir, "premium-home-v3-stories-signed-in-390x844.png"),
    });
  });
});
