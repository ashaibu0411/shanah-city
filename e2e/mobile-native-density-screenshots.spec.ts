import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  attachErrorCollectors,
  assertNoHorizontalOverflow,
  assertNoRuntimeErrors,
  waitForImages,
} from "./premium-v4-screenshot-helpers";
import { assertOpaqueMobileChrome } from "./helpers/mobile-opaque-chrome";

const artifactDir = path.join(process.cwd(), "docs/mobile-native-density-screenshots");

const VIEWPORTS = [
  { width: 390, height: 844, tag: "390x844" },
  { width: 430, height: 932, tag: "430x932" },
] as const;

const LIGHT_READING_ROUTES = ["/devotions", "/give", "/marriage", "/admin"] as const;

test.describe("Mobile native density screenshots", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactDir, { recursive: true });
  });

  for (const vp of VIEWPORTS) {
    test(`home, live, shorts, sermons at ${vp.tag}`, async ({ page }) => {
      const { pageErrors, consoleErrors } = attachErrorCollectors(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.goto("/", { waitUntil: "networkidle" });
      await page.waitForSelector(".premium-home-v4, .app-main", { timeout: 90_000 });
      await page.waitForFunction(() => document.body.dataset.shell === "mobile");
      await assertNoHorizontalOverflow(page);
      await assertOpaqueMobileChrome(page);
      await page.screenshot({
        path: path.join(artifactDir, `home-${vp.tag}-viewport.png`),
        fullPage: false,
      });
      await page.evaluate(() => window.scrollTo(0, Math.min(720, document.body.scrollHeight * 0.45)));
      await page.waitForTimeout(200);
      await assertNoHorizontalOverflow(page);
      await assertOpaqueMobileChrome(page);
      await page.screenshot({
        path: path.join(artifactDir, `home-${vp.tag}-scrolled.png`),
        fullPage: false,
      });

      await page.goto("/live", { waitUntil: "networkidle" });
      await page.waitForSelector(".sc-v4-media, .mobile-media-hub, .app-main", { timeout: 90_000 });
      await assertNoHorizontalOverflow(page);
      await assertOpaqueMobileChrome(page);
      await expect(page.locator(".mobile-tab-pills button", { hasText: /^Live/i })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await page.screenshot({
        path: path.join(artifactDir, `live-${vp.tag}-viewport.png`),
        fullPage: false,
      });
      await page.evaluate(() => window.scrollTo(0, Math.min(640, document.body.scrollHeight * 0.4)));
      await page.waitForTimeout(200);
      await assertNoHorizontalOverflow(page);
      await assertOpaqueMobileChrome(page);
      await page.screenshot({
        path: path.join(artifactDir, `live-${vp.tag}-scrolled.png`),
        fullPage: false,
      });

      await page.locator(".mobile-tab-pills button", { hasText: /^Shorts/i }).click();
      await page
        .locator(".sc-v4-media, .mobile-media-hub")
        .getByText(/Shorts|Clips are on the way|Upload a vertical clip/i)
        .first()
        .waitFor({ state: "visible", timeout: 30_000 });
      await expect(page.locator(".mobile-tab-pills button", { hasText: /^Shorts/i })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(page.locator(".mobile-tab-pills button", { hasText: /^Live/i })).toHaveAttribute(
        "aria-selected",
        "false",
      );
      await waitForImages(page, ".sc-v4-media, .mobile-media-hub", 0);
      await assertNoHorizontalOverflow(page);
      await assertOpaqueMobileChrome(page);
      await page.screenshot({
        path: path.join(artifactDir, `shorts-${vp.tag}-viewport.png`),
        fullPage: false,
      });
      await page.evaluate(() => window.scrollTo(0, Math.min(520, document.body.scrollHeight * 0.35)));
      await page.waitForTimeout(200);
      await page.screenshot({
        path: path.join(artifactDir, `shorts-${vp.tag}-scrolled.png`),
        fullPage: false,
      });

      await page.goto("/sermons", { waitUntil: "networkidle" });
      await page.waitForSelector(".sc-v4-sermons", { timeout: 90_000 });
      await assertNoHorizontalOverflow(page);
      await assertOpaqueMobileChrome(page);
      await page.screenshot({
        path: path.join(artifactDir, `sermons-${vp.tag}-viewport.png`),
        fullPage: false,
      });
      await page.evaluate(() => window.scrollTo(0, Math.min(800, document.body.scrollHeight * 0.55)));
      await page.waitForTimeout(200);
      await assertNoHorizontalOverflow(page);
      await assertOpaqueMobileChrome(page);
      await page.screenshot({
        path: path.join(artifactDir, `sermons-${vp.tag}-scrolled.png`),
        fullPage: false,
      });

      await assertNoRuntimeErrors(page, pageErrors, consoleErrors);
    });

    test(`light-themed routes unchanged at ${vp.tag}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of LIGHT_READING_ROUTES) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(page.locator("main.app-main")).toBeVisible({ timeout: 60_000 });
        await assertNoHorizontalOverflow(page);
        const cinematicBody = await page.evaluate(() =>
          document.body.classList.contains("premium-v4-cinematic-active"),
        );
        expect(cinematicBody, `${route} must not use cinematic mobile chrome`).toBe(false);
      }
    });
  }
});
