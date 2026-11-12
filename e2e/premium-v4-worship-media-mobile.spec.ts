import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  attachErrorCollectors,
  assertNoHorizontalOverflow,
  assertNoRuntimeErrors,
  waitForImages,
} from "./premium-v4-screenshot-helpers";

const artifactDir = path.join(
  process.cwd(),
  "docs/premium-v4-worship-media-screenshots",
);

const VIEWPORTS = [
  { width: 390, height: 844, tag: "390x844" },
  { width: 430, height: 932, tag: "430x932" },
] as const;

test.describe("Premium V4 worship & media mobile screenshots", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactDir, { recursive: true });
  });

  for (const vp of VIEWPORTS) {
    test(`live, shorts, sermons at ${vp.tag}`, async ({ page }) => {
      const { pageErrors, consoleErrors } = attachErrorCollectors(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.goto("/live", { waitUntil: "networkidle" });
      await page.waitForSelector(".mobile-media-hub", { timeout: 90_000 });
      await page.waitForSelector(".sc-v4-media", { timeout: 30_000 });
      await waitForImages(page, ".sc-v4-media", 0);
      await assertNoHorizontalOverflow(page);
      await expect(page.getByText("We're between broadcasts")).toBeVisible();
      await expect(page.getByRole("link", { name: /Watch on (YouTube|Facebook)/i })).toBeVisible();
      const badgesOverlap = await page.evaluate(() => {
        const badges = Array.from(
          document.querySelectorAll(".media-live-v4-metadata, .overflow-hidden.rounded-2xl span.rounded-full"),
        )
          .filter((el) => el.getBoundingClientRect().width > 0)
          .map((el) => el.getBoundingClientRect());
        for (let i = 0; i < badges.length; i++) {
          for (let j = i + 1; j < badges.length; j++) {
            const a = badges[i];
            const b = badges[j];
            const overlap =
              a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
            const area = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (overlap && area > 8 && height > 8) return true;
          }
        }
        return false;
      });
      expect(badgesOverlap, "live stage badges must not overlap").toBe(false);
      await assertNoRuntimeErrors(page, pageErrors, consoleErrors);

      await page.screenshot({
        path: path.join(artifactDir, `live-${vp.tag}-viewport.png`),
        fullPage: false,
      });
      await page.screenshot({
        path: path.join(artifactDir, `live-${vp.tag}-full.png`),
        fullPage: true,
      });

      await page.getByRole("button", { name: /Shorts/ }).click();
      await page
        .locator(".sc-v4-media")
        .getByText(/Shorts|Upload a vertical clip|Clips are on the way/i)
        .first()
        .waitFor({ state: "visible", timeout: 30_000 });
      await waitForImages(page, ".sc-v4-media", 0);
      await assertNoHorizontalOverflow(page);

      await page.screenshot({
        path: path.join(artifactDir, `live-shorts-${vp.tag}-viewport.png`),
        fullPage: false,
      });
      await page.screenshot({
        path: path.join(artifactDir, `live-shorts-${vp.tag}-full.png`),
        fullPage: true,
      });

      await page.goto("/sermons", { waitUntil: "networkidle" });
      await page.waitForSelector(".sc-v4-sermons", { timeout: 90_000 });
      await page
        .locator(".sc-v4-sermon-feature, .sc-v4-sermon-archive-title")
        .first()
        .waitFor({ state: "visible", timeout: 30_000 });
      await assertNoHorizontalOverflow(page);
      await assertNoRuntimeErrors(page, pageErrors, consoleErrors);

      await page.screenshot({
        path: path.join(artifactDir, `sermons-${vp.tag}-viewport.png`),
        fullPage: false,
      });
      await page.screenshot({
        path: path.join(artifactDir, `sermons-${vp.tag}-full.png`),
        fullPage: true,
      });
    });
  }
});
