import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import { signInForCommunityScreenshots } from "./helpers/community-screenshot-auth";
import {
  assertNoHorizontalOverflow,
  assertNoRuntimeErrors,
  IGNORABLE_CONSOLE,
} from "./premium-v4-screenshot-helpers";
import { assertCommunityV6LightChrome } from "./helpers/mobile-v6-light-chrome";

const POPULATED_IGNORE = new RegExp(
  `${IGNORABLE_CONSOLE.source}|Failed to load resource.*(404|500)|graph\\.facebook\\.com`,
);

function attachErrorCollectors(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (POPULATED_IGNORE.test(text)) return;
    consoleErrors.push(text);
  });
  return { pageErrors, consoleErrors };
}

const dir = path.join(process.cwd(), "docs/community-social-feed-v6-screenshots");
const enabled = process.env.PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES === "1";
test.skip(!enabled, "Requires synthetic QA fixture (PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES=1)");
test.describe.configure({ mode: "serial" });

for (const vp of [
  { width: 390, height: 844, tag: "390x844" },
  { width: 430, height: 932, tag: "430x932" },
]) {
  test(`community v6 layout ${vp.tag}`, async ({ page }) => {
    if (!process.env.PLAYWRIGHT_COMMUNITY_EMAIL || !process.env.PLAYWRIGHT_COMMUNITY_PASSWORD) {
      throw new Error("Provide synthetic QA credentials.");
    }
    const { pageErrors, consoleErrors } = attachErrorCollectors(page);
    await page.setViewportSize({ width: vp.width, height: vp.height });

    expect(await signInForCommunityScreenshots(page)).toBe(true);
    await page.goto("/community", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".sc-v6-social-feed", { timeout: 90_000 });
    await expect
      .poll(async () => page.locator(".community-composer-trigger").first().innerText(), { timeout: 120_000 })
      .not.toMatch(/Sign in to share/i);

    await assertNoHorizontalOverflow(page);
    await assertCommunityV6LightChrome(page);
    fs.mkdirSync(dir, { recursive: true });

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: path.join(dir, `community-v6-full-mobile-${vp.tag}.png`) });
    await page.screenshot({ path: path.join(dir, `community-v6-top-${vp.tag}.png`) });

    const storiesTrack = page.locator(".community-stories-strip--v6 .community-stories-row");
    await expect(storiesTrack).toBeVisible({ timeout: 60_000 });
    await storiesTrack.evaluate((el) => {
      el.scrollLeft = Math.min(180, el.scrollWidth);
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(dir, `community-v6-stories-${vp.tag}.png`) });

    const reels = page.locator(".community-v6-reels");
    if (await reels.count()) {
      await reels.evaluate((el) => el.scrollIntoView({ block: "start" }));
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(dir, `community-v6-reels-${vp.tag}.png`) });
    }

    const feedFilters = page.locator(".community-feed-tabs--v6").first();
    await feedFilters.evaluate((el) => el.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(dir, `community-v6-filters-${vp.tag}.png`) });

    const actionsMain = page
      .locator(".community-post-actions-row--social .community-post-actions-row__main")
      .first();
    await expect
      .poll(() => page.locator(".community-feed-posts .community-post-card").count())
      .toBeGreaterThanOrEqual(1);
    const firstPostHeader = page.locator(".community-post-card--social-feed .community-post-header").first();
    await expect(firstPostHeader).toBeVisible();
    await page.screenshot({ path: path.join(dir, `community-v6-first-post-${vp.tag}.png`) });

    await actionsMain.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(dir, `community-v6-post-actions-${vp.tag}.png`) });

    await page.screenshot({ path: path.join(dir, `community-v6-feed-${vp.tag}.png`) });

    const photoPost = page
      .locator(".community-post-card--social-feed")
      .filter({ has: page.locator(".community-media-social-photo-frame img, .community-post-media img") })
      .first();
    if (await photoPost.count()) {
      await photoPost.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(dir, `community-v6-post-photo-${vp.tag}.png`) });
    }

    const videoPost = page
      .locator(".community-post-card--social-feed")
      .filter({ has: page.locator(".community-media-social-video-frame video, .community-media-slide-video") })
      .first();
    if (await videoPost.count()) {
      await videoPost.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await expect
        .poll(async () => {
          const box = await videoPost.locator("video").first().boundingBox();
          return box ? box.height : 0;
        })
        .toBeGreaterThan(120);
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(dir, `community-v6-post-video-${vp.tag}.png`) });
    }

    await assertNoHorizontalOverflow(page);
    await assertNoRuntimeErrors(page, pageErrors, consoleErrors);
  });
}
