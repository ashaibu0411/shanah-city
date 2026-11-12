import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  attachErrorCollectors,
  assertNoHorizontalOverflow,
  assertNoRuntimeErrors,
  waitForImages,
} from "./premium-v4-screenshot-helpers";
import { signInForCommunityScreenshots } from "./helpers/community-screenshot-auth";

const artifactDir = path.join(
  process.cwd(),
  "docs/premium-v4-community-screenshots",
);

const VIEWPORTS = [
  { width: 390, height: 844, tag: "390x844" },
  { width: 430, height: 932, tag: "430x932" },
] as const;

test.describe("Premium V4 community mobile screenshots", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactDir, { recursive: true });
  });

  for (const vp of VIEWPORTS) {
    test(`community stories and feed at ${vp.tag}`, async ({ page }) => {
      const { pageErrors, consoleErrors } = attachErrorCollectors(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const signedIn = await signInForCommunityScreenshots(page);
      if (!signedIn) {
        test.info().annotations.push({
          type: "note",
          description:
            "Guest capture — set PLAYWRIGHT_COMMUNITY_EMAIL and PLAYWRIGHT_COMMUNITY_PASSWORD for signed-in feed/stories.",
        });
      }

      await page.goto("/community", { waitUntil: "networkidle" });
      await page.waitForFunction(() =>
        document.body.classList.contains("premium-v4-cinematic-active"),
      );
      await page.waitForSelector(".sc-v4-community", { timeout: 90_000 });
      await page.waitForSelector("#community-refresh-title", { timeout: 30_000 });
      await page.waitForSelector(".community-page-stories", { timeout: 30_000 });
      await waitForImages(page, ".sc-v4-community", 0);
      await assertNoHorizontalOverflow(page);
      await assertNoRuntimeErrors(page, pageErrors, consoleErrors);

      await expect(
        page.getByRole("heading", { name: /Our community.*Our stories/i }),
      ).toBeVisible();

      await page.screenshot({
        path: path.join(artifactDir, `community-${vp.tag}-viewport.png`),
        fullPage: false,
      });

      await page
        .locator(".community-refresh-feed-heading")
        .scrollIntoViewIfNeeded();
      await page
        .getByRole("heading", { name: "From our church family" })
        .waitFor({ state: "visible", timeout: 30_000 });

      await page.screenshot({
        path: path.join(artifactDir, `community-feed-${vp.tag}-viewport.png`),
        fullPage: false,
      });

      await page.goto("/community", { waitUntil: "networkidle" });
      await page.waitForSelector(".sc-v4-community");
      await assertNoHorizontalOverflow(page);

      await page.screenshot({
        path: path.join(artifactDir, `community-${vp.tag}-full.png`),
        fullPage: true,
      });
    });
  }
});
