import { test, expect } from "@playwright/test";
import { assertOpaqueMobileChrome } from "./helpers/mobile-opaque-chrome";

const pages = ["/", "/live", "/sermons"] as const;
const sizes = [
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const;

test.describe("Native mobile layout and scroll regressions", () => {
  for (const viewport of sizes) {
    for (const route of pages) {
      test(`${route} at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(page.locator("main.app-main")).toBeVisible();
        const before = await page.evaluate(() => {
          const header = document.querySelector(".mobile-app-header")?.getBoundingClientRect();
          const bottom = document.querySelector(".app-mobile-bottom-nav")?.getBoundingClientRect();
          const main = document.querySelector("main.app-main")?.getBoundingClientRect();
          return {
            scrollWidth: document.documentElement.scrollWidth,
            viewportWidth: document.documentElement.clientWidth,
            headerBottom: header?.bottom ?? 0,
            navTop: bottom?.top ?? 0,
            mainWidth: main?.width ?? 0,
          };
        });
        expect(before.scrollWidth).toBeLessThanOrEqual(before.viewportWidth + 1);
        expect(before.mainWidth).toBeLessThanOrEqual(before.viewportWidth + 1);
        expect(before.headerBottom).toBeGreaterThan(0);
        expect(before.navTop).toBeLessThanOrEqual(viewport.height);
        await assertOpaqueMobileChrome(page);

        await page.evaluate(() => window.scrollTo({ top: 550, behavior: "instant" }));
        await page.waitForTimeout(150);
        await assertOpaqueMobileChrome(page);
        const scrolled = await page.evaluate(() => {
          const header = document.querySelector(".mobile-app-header")?.getBoundingClientRect();
          const bottom = document.querySelector(".app-mobile-bottom-nav")?.getBoundingClientRect();
          const main = document.querySelector("main.app-main");
          return {
            headerTop: header?.top ?? 0,
            headerBottom: header?.bottom ?? 0,
            navBottom: bottom?.bottom ?? 0,
            scrollX: window.scrollX,
            mainPaddingBottom: main ? parseFloat(getComputedStyle(main).paddingBottom) : 0,
          };
        });
        expect(scrolled.scrollX).toBe(0);
        expect(scrolled.headerTop).toBeGreaterThanOrEqual(-1);
        expect(scrolled.headerBottom).toBeGreaterThan(20);
        expect(scrolled.navBottom).toBeGreaterThanOrEqual(viewport.height - 2);
        expect(scrolled.mainPaddingBottom).toBeGreaterThan(60);
      });
    }
  }

  test("live and shorts tab selected states at 390x844", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/live", { waitUntil: "networkidle" });
    await page.waitForSelector(".mobile-tab-pills", { timeout: 60_000 });

    const liveTab = page.locator(".mobile-tab-pills button", { hasText: /^Live/i });
    const shortsTab = page.locator(".mobile-tab-pills button", { hasText: /^Shorts/i });

    await expect(liveTab).toHaveAttribute("aria-selected", "true");
    await expect(shortsTab).toHaveAttribute("aria-selected", "false");

    const liveSelected = await liveTab.evaluate((el) => {
      const s = getComputedStyle(el);
      return { color: s.color, backgroundColor: s.backgroundColor, opacity: s.opacity };
    });
    expect(parseFloat(liveSelected.opacity)).toBe(1);
    expect(liveSelected.backgroundColor).toBe("rgb(233, 188, 114)");

    await shortsTab.click();
    await expect(shortsTab).toHaveAttribute("aria-selected", "true");
    await expect(liveTab).toHaveAttribute("aria-selected", "false");
    await page.waitForFunction(() => {
      const live = document.querySelector('.mobile-tab-pills button[aria-selected="false"]');
      if (!live) return false;
      return getComputedStyle(live).backgroundColor === "rgb(27, 45, 75)";
    });

    const inactiveLive = await liveTab.evaluate((el) => {
      const s = getComputedStyle(el);
      return { color: s.color, backgroundColor: s.backgroundColor, opacity: s.opacity };
    });
    expect(parseFloat(inactiveLive.opacity)).toBe(1);
    expect(inactiveLive.backgroundColor).toBe("rgb(27, 45, 75)");
  });
});
