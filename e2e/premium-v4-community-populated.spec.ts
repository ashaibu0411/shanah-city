import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { signInForCommunityScreenshots } from "./helpers/community-screenshot-auth";
import {
  attachErrorCollectors,
  assertNoHorizontalOverflow,
  assertNoRuntimeErrors,
  waitForImages,
} from "./premium-v4-screenshot-helpers";

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
    const { pageErrors, consoleErrors } = attachErrorCollectors(page);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    expect(await signInForCommunityScreenshots(page)).toBe(true);
    await page.goto("/community", { waitUntil: "networkidle" });
    await expect(page.locator(".sc-v4-community")).toBeVisible();
    await expect(page.locator(".community-stories-strip")).toBeVisible();
    await expect.poll(async () => page.locator(".community-story-ring").count()).toBeGreaterThan(1);
    await expect.poll(async () => page.locator(".community-feed-posts .community-post-card").count()).toBeGreaterThanOrEqual(2);
    await expect(page.locator(".community-post-card img").first()).toBeVisible();
    await waitForImages(page, ".sc-v4-community", 0);
    await assertNoHorizontalOverflow(page);
    await assertNoRuntimeErrors(page, pageErrors, consoleErrors);

    fs.mkdirSync(dir, { recursive: true });
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
    await assertNoRuntimeErrors(page, pageErrors, consoleErrors);
  });
}
