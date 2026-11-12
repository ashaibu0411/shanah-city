import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { signInForCommunityScreenshots } from "./helpers/community-screenshot-auth";
import type { Page } from "@playwright/test";
import {
  assertNoHorizontalOverflow,
  assertNoRuntimeErrors,
  waitForImages,
  IGNORABLE_CONSOLE,
} from "./premium-v4-screenshot-helpers";
import { assertOpaqueMobileChrome } from "./helpers/mobile-opaque-chrome";

/** Local/staging QA often lacks Vercel Blob; avatar fetches may 500 without affecting Community UI. */
const POPULATED_IGNORE = new RegExp(
  `${IGNORABLE_CONSOLE.source}|Failed to load resource.*(404|500)|graph\\.facebook\\.com`,
);

function attachPopulatedErrorCollectors(page: Page) {
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

/**
 * Opt-in validation with approved, synthetic staging data only.
 * DO NOT use real member credentials or capture private member information.
 * The test deliberately fails on empty data: an empty guest feed is NOT proof
 * that the populated Community and Stories design works.
 */
const dir = path.join(process.cwd(), "docs/premium-v4-community-screenshots");
const enabled = process.env.PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES === "1";
test.skip(!enabled, "Requires a staging test member and approved synthetic stories/posts");

for (const vp of [
  { width: 390, height: 844, tag: "390x844" },
  { width: 430, height: 932, tag: "430x932" },
]) {
  test(`signed-in populated Community at ${vp.tag}`, async ({ page }) => {
    if (!process.env.PLAYWRIGHT_COMMUNITY_EMAIL || !process.env.PLAYWRIGHT_COMMUNITY_PASSWORD) {
      throw new Error("Provide synthetic staging member credentials, not a real member account.");
    }
    const { pageErrors, consoleErrors } = attachPopulatedErrorCollectors(page);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    expect(await signInForCommunityScreenshots(page)).toBe(true);
    await page.goto("/community", { waitUntil: "networkidle" });
    await expect(page.locator(".sc-v4-community")).toBeVisible();
    await expect(page.locator(".community-stories-strip")).toBeVisible();
    await expect.poll(async () => page.locator(".community-story-ring").count()).toBeGreaterThan(1);
    await expect.poll(async () => page.locator(".community-feed-posts .community-post-card").count()).toBeGreaterThanOrEqual(2);
    const imagePost = page.locator(".community-post-card img").first();
    await imagePost.scrollIntoViewIfNeeded();
    await expect(imagePost).toBeAttached();
    await expect
      .poll(async () => imagePost.evaluate((img) => (img as HTMLImageElement).naturalWidth > 0))
      .toBeTruthy();
    await waitForImages(page, ".sc-v4-community", 0);
    await assertNoHorizontalOverflow(page);
    await assertOpaqueMobileChrome(page);
    await assertNoRuntimeErrors(page, pageErrors, consoleErrors);

    fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({
      path: path.join(dir, `community-stories-populated-${vp.tag}-viewport.png`),
      clip: { x: 0, y: 0, width: vp.width, height: Math.min(vp.height, 220) },
    });
    await page.screenshot({
      path: path.join(dir, `community-populated-${vp.tag}-viewport.png`),
    });
    await page.screenshot({
      path: path.join(dir, `community-populated-${vp.tag}-full.png`),
      fullPage: true,
    });

    // Open the actual member composer UI without submitting a post.
    const trigger = page.locator(".community-composer-trigger").first();
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Create post" })).toBeVisible();
    await page.screenshot({
      path: path.join(dir, `community-composer-${vp.tag}-viewport.png`),
    });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    const storyRing = page.locator(".community-story-ring-unseen, .community-story-ring-seen").first();
    await storyRing.click();
    await expect(page.locator(".community-story-viewer")).toBeVisible({ timeout: 30_000 });
    await page.screenshot({
      path: path.join(dir, `community-story-viewer-${vp.tag}-viewport.png`),
    });
    await page.keyboard.press("Escape");
    await expect(page.locator(".community-story-viewer")).toBeHidden({ timeout: 15_000 });

    const commentControl = page
      .locator(".community-feed-posts .community-post-card")
      .first()
      .getByRole("button", { name: /comment/i });
    await commentControl.click();
    await expect(page.getByRole("dialog").filter({ hasText: /comment/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.screenshot({
      path: path.join(dir, `community-comments-${vp.tag}-viewport.png`),
    });
    await page.keyboard.press("Escape");

    const filterRail = page.locator(".community-feed-tabs");
    await filterRail.evaluate((el) => {
      el.scrollLeft = Math.min(140, el.scrollWidth);
    });
    await page.waitForTimeout(150);
    await page.screenshot({
      path: path.join(dir, `community-filter-tabs-populated-${vp.tag}-viewport.png`),
    });

    await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }));
    await page.waitForTimeout(200);
    await assertNoHorizontalOverflow(page);
    await assertOpaqueMobileChrome(page);
    await page.screenshot({
      path: path.join(dir, `community-populated-${vp.tag}-scrolled.png`),
    });
    await assertNoRuntimeErrors(page, pageErrors, consoleErrors);
  });
}
