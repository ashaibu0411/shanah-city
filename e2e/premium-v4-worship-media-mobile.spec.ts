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
