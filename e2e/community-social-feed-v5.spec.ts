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

const dir = path.join(process.cwd(), "docs/community-social-feed-v5-screenshots");
const populated = process.env.PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES === "1";

for (const vp of [
  { width: 390, height: 844, tag: "390x844" },
  { width: 430, height: 932, tag: "430x932" },
]) {
  test(`community v5 layout ${vp.tag}`, async ({ page }) => {
    const { pageErrors, consoleErrors } = attachErrorCollectors(page);
    await page.setViewportSize({ width: vp.width, height: vp.height });

    if (populated) {
      if (!process.env.PLAYWRIGHT_COMMUNITY_EMAIL || !process.env.PLAYWRIGHT_COMMUNITY_PASSWORD) {
        throw new Error("Provide synthetic QA credentials.");
      }
      expect(await signInForCommunityScreenshots(page)).toBe(true);
    }

    await page.goto("/community", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".sc-v5-social-feed", { timeout: 90_000 });
    await expect(page.locator(".sc-v5-social-feed")).toBeVisible({ timeout: 60_000 });
    await expect(page.locator(".community-composer-trigger").first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await assertOpaqueMobileChrome(page);

    fs.mkdirSync(dir, { recursive: true });

    await page.screenshot({
      path: path.join(dir, `community-v5-top-${vp.tag}.png`),
      clip: { x: 0, y: 0, width: vp.width, height: Math.min(vp.height, 280) },
    });

    if (populated) {
      await expect(page.locator(".community-portrait-story-card").first()).toBeVisible({ timeout: 45_000 });
      await expect.poll(() => page.locator(".community-portrait-story-card").count()).toBeGreaterThan(1);

      const storiesTrack = page.locator(".community-stories-row");
      await storiesTrack.evaluate((el) => {
        el.scrollLeft = Math.min(220, el.scrollWidth);
      });
      await page.waitForTimeout(200);
      await page.screenshot({
        path: path.join(dir, `community-v5-stories-scrolled-${vp.tag}.png`),
        clip: { x: 0, y: 0, width: vp.width, height: Math.min(vp.height, 300) },
      });

      await expect.poll(() => page.locator(".community-feed-posts .community-post-card").count()).toBeGreaterThanOrEqual(1);
      const mediaImage = page.locator(".community-post-media img").first();
      if (await mediaImage.count()) {
        await mediaImage.scrollIntoViewIfNeeded();
        await waitForImages(page, ".community-post-media", 1);
      }

      await page.screenshot({
        path: path.join(dir, `community-v5-populated-feed-${vp.tag}.png`),
      });

      const header = page.locator(".community-post-card--social-feed .community-post-header").first();
      if (await header.isVisible().catch(() => false)) {
        await header.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: path.join(dir, `community-v5-post-header-${vp.tag}.png`),
          clip: { x: 0, y: Math.max(0, (await header.boundingBox())!.y - 8), width: vp.width, height: 220 },
        });
      }

      const actions = page.locator(".community-post-actions-row").first();
      if (await actions.isVisible().catch(() => false)) {
        await actions.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: path.join(dir, `community-v5-post-actions-${vp.tag}.png`),
          clip: { x: 0, y: Math.max(0, (await actions.boundingBox())!.y - 40), width: vp.width, height: 260 },
        });
      }

      const highlights = page.locator(".community-v5-highlights");
      if (await highlights.isVisible().catch(() => false)) {
        await highlights.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: path.join(dir, `community-v5-highlights-${vp.tag}.png`),
          clip: { x: 0, y: Math.max(0, (await highlights.boundingBox())!.y - 6), width: vp.width, height: 280 },
        });
      }

      const storyCard = page.locator(".community-portrait-story-card").filter({ hasNotText: /create/i }).nth(2);
      if (await storyCard.isVisible().catch(() => false)) {
        await storyCard.click();
        const viewer = page.locator(".community-story-viewer");
        await expect(viewer).toBeVisible({ timeout: 30_000 });
        await viewer.evaluate(async (element) => {
          await Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
        });
        await expect.poll(() => viewer.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
        await page.screenshot({
          path: path.join(dir, `community-v5-story-viewer-${vp.tag}.png`),
        });
        await page.keyboard.press("Escape");
      }

      const trigger = page.locator(".community-composer-trigger").first();
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Create post" });
      await expect(dialog).toBeVisible();
      await page.screenshot({
        path: path.join(dir, `community-v5-composer-${vp.tag}.png`),
      });
      await dialog.getByRole("button", { name: /Close composer/i }).click();

      const commentControl = page
        .locator(".community-feed-posts .community-post-card")
        .first()
        .getByRole("button", { name: /^Comment$/i });
      if (await commentControl.isVisible().catch(() => false)) {
        await commentControl.click();
        await expect(page.getByRole("dialog").filter({ hasText: /comment/i })).toBeVisible({
          timeout: 30_000,
        });
        await page.screenshot({
          path: path.join(dir, `community-v5-comments-${vp.tag}.png`),
        });
        await page.keyboard.press("Escape");
      }
    }

    await page.evaluate(() => window.scrollTo({ top: 720, behavior: "instant" }));
    await page.waitForTimeout(200);
    await assertOpaqueMobileChrome(page);
    await page.screenshot({
      path: path.join(dir, `community-v5-scrolled-${vp.tag}.png`),
    });

    await assertNoHorizontalOverflow(page);
    await assertNoRuntimeErrors(page, pageErrors, consoleErrors);
  });
}
