import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { signInForCommunityScreenshots } from "./helpers/community-screenshot-auth";

const artifactDir = path.join(process.cwd(), "docs/premium-home-v3-spacing-v3-screenshots");

const VIEWPORTS = [
  { width: 320, height: 568, tag: "320x568" },
  { width: 375, height: 812, tag: "375x812" },
  { width: 390, height: 844, tag: "390x844" },
  { width: 430, height: 932, tag: "430x932" },
] as const;

test.describe("Premium Home V3 mobile spacing V3", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactDir, { recursive: true });
  });

  for (const vp of VIEWPORTS) {
    test(`layout and screenshot ${vp.tag}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".premium-home-v3", { timeout: 90_000 });
      await page.waitForFunction(() => document.body.classList.contains("premium-home-v3-active"));

      await signInForCommunityScreenshots(page).catch(() => {
        /* guest home still valid for spacing */
      });

      await page.waitForTimeout(400);

      const metrics = await page.evaluate(() => {
        const stories = document.querySelector(".premium-stories--home-v3");
        const hero = document.querySelector(".ph4-hero");
        const tiles = document.querySelectorAll(".ph4-tile");
        const storyRow = document.querySelector(".community-stories-row");
        const vw = window.innerWidth;
        const storiesRect = stories?.getBoundingClientRect();
        const heroRect = hero?.getBoundingClientRect();
        const tileHeights = [...tiles].map((t) => Math.round(t.getBoundingClientRect().height));
        const gutterLeft = heroRect ? Math.round(heroRect.left) : null;
        const storiesToHero =
          storiesRect && heroRect ? Math.round(heroRect.top - storiesRect.bottom) : null;
        return {
          viewportWidth: vw,
          scrollOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          gutterLeft,
          gutterRight: heroRect ? Math.round(vw - heroRect.right) : null,
          storiesToHero,
          tileHeights,
          tilesEqualHeight: tileHeights.length >= 2 && Math.abs(tileHeights[0] - tileHeights[1]) <= 2,
          storyRowScrollable:
            storyRow != null && storyRow.scrollWidth > storyRow.clientWidth,
        };
      });

      await page.screenshot({
        path: path.join(artifactDir, `premium-home-spacing-v3-${vp.tag}.png`),
        fullPage: true,
      });

      console.info(`SPACING_V3_${vp.tag}`, JSON.stringify(metrics));

      expect(metrics.scrollOverflow).toBe(false);
      expect(metrics.gutterLeft ?? 0).toBeGreaterThanOrEqual(15);
      expect(metrics.gutterLeft ?? 99).toBeLessThanOrEqual(18);
      expect(metrics.gutterRight ?? 0).toBeGreaterThanOrEqual(15);
      expect(metrics.gutterRight ?? 99).toBeLessThanOrEqual(18);
      if (metrics.storiesToHero != null) {
        expect(metrics.storiesToHero).toBeGreaterThanOrEqual(20);
        expect(metrics.storiesToHero).toBeLessThanOrEqual(30);
      }
      if (metrics.tileHeights.length >= 2) {
        expect(metrics.tilesEqualHeight).toBe(true);
      }
    });
  }
});

test.describe("Premium Home V3 spacing V3 — desktop unchanged", () => {
  test("website shell at 1024px has no mobile spacing hook", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    const desktop = await page.evaluate(() => ({
      spacingHook: document.querySelector(".premium-home-v3--spacing-v3") != null,
      v3Active: document.body.classList.contains("premium-home-v3-active"),
      shell: document.body.dataset.shell ?? null,
      hasMobileBottomNav: document.querySelector(".mobile-bottom-nav") != null,
    }));
    console.info("SPACING_V3_DESKTOP", JSON.stringify(desktop));
    expect(desktop.spacingHook).toBe(false);
    expect(desktop.v3Active).toBe(false);
    expect(desktop.shell).toBe("website");
  });
});

test.describe("Premium Home V3 spacing V3 — stories rail (signed-in)", () => {
  test.skip(process.env.PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES !== "1", "Requires synthetic QA fixture + credentials");

  test("carousel scroll, thumbnails, Create Story/Reel", async ({ page }) => {
    if (!process.env.PLAYWRIGHT_COMMUNITY_EMAIL?.trim() || !process.env.PLAYWRIGHT_COMMUNITY_PASSWORD) {
      throw new Error("Set PLAYWRIGHT_COMMUNITY_EMAIL and PLAYWRIGHT_COMMUNITY_PASSWORD");
    }
    await page.setViewportSize({ width: 320, height: 568 });
    expect(await signInForCommunityScreenshots(page)).toBe(true);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".premium-stories--home-v3 .community-stories-row", { timeout: 90_000 });

    await expect(page.getByText("Create Story", { exact: true })).toBeVisible();
    await expect(page.getByText("Create reel", { exact: true })).toBeVisible();

    const storyMetrics = await page.evaluate(() => {
      const row = document.querySelector(".premium-stories--home-v3 .community-stories-row");
      if (!(row instanceof HTMLElement)) throw new Error("Missing stories row");
      const cards = row.querySelectorAll(".community-portrait-story-card");
      const textPreviews = row.querySelectorAll(".community-portrait-story-card__text-preview");
      let previewOverflow = false;
      for (const el of textPreviews) {
        const box = el;
        if (box.scrollHeight > box.clientHeight + 2) previewOverflow = true;
      }
      const before = row.scrollLeft;
      row.scrollBy({ left: Math.max(120, row.clientWidth * 0.6), behavior: "instant" });
      const after = row.scrollLeft;
      return {
        cardCount: cards.length,
        scrollable: row.scrollWidth > row.clientWidth + 4,
        scrolled: after > before,
        textPreviewCount: textPreviews.length,
        previewOverflow,
      };
    });

    console.info("SPACING_V3_STORIES", JSON.stringify(storyMetrics));
    expect(storyMetrics.cardCount).toBeGreaterThanOrEqual(2);
    expect(storyMetrics.previewOverflow).toBe(false);
    if (storyMetrics.scrollable) {
      expect(storyMetrics.scrolled).toBe(true);
    }

    await page.locator(".premium-stories--home-v3").screenshot({
      path: path.join(artifactDir, "premium-home-spacing-v3-stories-signed-in-320x568.png"),
    });
  });
});