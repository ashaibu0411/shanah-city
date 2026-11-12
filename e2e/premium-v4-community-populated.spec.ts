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
    await expect(page.locator(".community-stories-strip--portrait, .community-stories-strip")).toBeVisible();
    await expect
      .poll(async () =>
        (await page.locator(".community-portrait-story-card, .community-story-ring").count()),
      )
      .toBeGreaterThan(1);
    await expect.poll(async () => page.locator(".community-feed-posts .community-post-card").count()).toBeGreaterThanOrEqual(2);
    const mediaImage = page.locator(".community-post-media img").first();
    await expect(mediaImage).toBeVisible({ timeout: 30_000 });
    await mediaImage.scrollIntoViewIfNeeded();
    await waitForImages(page, ".community-post-media", 1);
    await waitForImages(page, ".sc-v4-community", 0);
    await assertNoHorizontalOverflow(page);
    await assertOpaqueMobileChrome(page);

    fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({
      path: path.join(dir, `community-stories-populated-${vp.tag}-viewport.png`),
      clip: { x: 0, y: 0, width: vp.width, height: Math.min(vp.height, 230) },
    });
    await page.screenshot({
      path: path.join(dir, `community-populated-${vp.tag}-viewport.png`),
    });

    const composerActions = page.locator(".community-composer-actions");
    await composerActions.evaluate((el) => {
      el.scrollLeft = Math.min(260, el.scrollWidth);
    });
    await page.waitForTimeout(150);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: path.join(dir, `community-composer-actions-${vp.tag}-viewport.png`),
    });
    await composerActions.evaluate((el) => {
      el.scrollLeft = 0;
    });

    await page.getByRole("tab", { name: /^Praise$/i }).click();
    await page.waitForTimeout(200);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: path.join(dir, `community-filter-selected-${vp.tag}-viewport.png`),
    });

    const filterRail = page.locator(".community-feed-tabs");
    await filterRail.evaluate((el) => {
      el.scrollLeft = Math.min(160, el.scrollWidth);
    });
    await page.waitForTimeout(150);
    await page.screenshot({
      path: path.join(dir, `community-filter-tabs-populated-${vp.tag}-viewport.png`),
    });

    await page.evaluate(() => window.scrollTo({ top: 720, behavior: "instant" }));
    await page.waitForTimeout(200);
    await assertOpaqueMobileChrome(page);
    await page.screenshot({
      path: path.join(dir, `community-populated-${vp.tag}-scrolled.png`),
    });
    await page.evaluate(() => window.scrollTo(0, 0));

    const trigger = page.locator(".community-composer-trigger").first();
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Create post" });
    await expect(dialog).toBeVisible();
    await page.screenshot({
      path: path.join(dir, `community-composer-${vp.tag}-viewport.png`),
    });
    const composerField = dialog.locator("textarea").first();
    await composerField.click();
    await composerField.fill("Synthetic QA draft — not submitted.");
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(dir, `community-composer-keyboard-${vp.tag}-viewport.png`),
    });
    await dialog.getByRole("button", { name: /Close composer/i }).click();
    await expect(dialog).toBeHidden({ timeout: 15_000 });

    const storyRing = page
      .locator(
        ".community-portrait-story-card--unseen, .community-portrait-story-card--seen, .community-story-ring-unseen, .community-story-ring-seen",
      )
      .first();
    await storyRing.click();
    const viewer = page.locator(".community-story-viewer");
    await expect(viewer).toBeVisible({ timeout: 30_000 });
    // Wait for the viewer entrance fade before capturing; otherwise screenshots
    // record a partially transparent frame over the Community feed.
    await viewer.evaluate(async (element) => {
      await Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
    });
    await expect.poll(() => viewer.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
    await expect.poll(() => viewer.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(0, 0, 0)");
    await expect.poll(() =>
      page.evaluate(() => {
        const viewerEl = document.querySelector(".community-story-viewer");
        const hit = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        return Boolean(viewerEl && hit && viewerEl.contains(hit));
      }),
    ).toBe(true);
    await page.screenshot({
      path: path.join(dir, `community-story-viewer-${vp.tag}-viewport.png`),
    });
    const nextStory = page.getByRole("button", { name: "Next story" });
    if (await nextStory.isVisible().catch(() => false)) {
      await nextStory.click();
      await page.waitForTimeout(250);
      await page.screenshot({
        path: path.join(dir, `community-story-viewer-slide-${vp.tag}-viewport.png`),
      });
    }
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden({ timeout: 15_000 });

    const likeBtn = page.locator(".community-feed-posts .community-post-card").first().getByRole("button", { name: /^Like$/i });
    if (await likeBtn.isVisible().catch(() => false)) {
      await likeBtn.click();
      await page.waitForTimeout(150);
    }

    const commentControl = page
      .locator(".community-feed-posts .community-post-card")
      .first()
      .getByRole("button", { name: /^Comment$/i });
    await commentControl.click();
    await expect(page.getByRole("dialog").filter({ hasText: /comment/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.screenshot({
      path: path.join(dir, `community-comments-${vp.tag}-viewport.png`),
    });
    const replyToggle = page.getByRole("button", { name: /reply/i }).first();
    if (await replyToggle.isVisible().catch(() => false)) {
      await replyToggle.click();
      await page.waitForTimeout(150);
    }
    await page.screenshot({
      path: path.join(dir, `community-replies-${vp.tag}-viewport.png`),
    });
    await page.keyboard.press("Escape");

    await assertNoHorizontalOverflow(page);
    await assertNoRuntimeErrors(page, pageErrors, consoleErrors);
  });
}
