import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const artifactDir = path.join(process.cwd(), "docs/premium-home-v4-screenshots");
const IGNORABLE_CONSOLE =
  /favicon|third-party|chrome-extension|Failed to load resource.*(401|503)|youtube|facebook|google-analytics/i;

test.describe("Premium Home V4 mobile screenshots", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactDir, { recursive: true });
  });

  test("home at 390x844 and 430x932", async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (IGNORABLE_CONSOLE.test(text)) return;
      consoleErrors.push(text);
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector(".premium-home-v4", { timeout: 90_000 });
    await page.waitForFunction(() =>
      document.body.classList.contains("premium-home-v4-active"),
    );
    await expect(page.locator(".ph4-hero__title")).toHaveText("Shanah City");
    await expect(page.locator(".ph4-tile-grid")).toBeVisible();

    await page.waitForFunction(
      () => {
        const imgs = Array.from(
          document.querySelectorAll(".premium-home-v4 img"),
        ) as HTMLImageElement[];
        return (
          imgs.length >= 6 &&
          imgs.every((img) => img.complete && img.naturalWidth > 0)
        );
      },
      undefined,
      { timeout: 60_000 },
    );

    await expect(page.locator("#devtools-indicator")).toHaveCount(0);
    await expect(page.getByText("1 Issue", { exact: true })).toHaveCount(0);

    expect(
      [...pageErrors, ...consoleErrors],
      [...pageErrors, ...consoleErrors].join("\n"),
    ).toEqual([]);

    await page.waitForFunction(() => {
      const doc = document.documentElement;
      return doc.scrollWidth <= doc.clientWidth + 1;
    });

    await expect(
      page.locator('img[src*="shanah-city-logo-dark"]'),
    ).toBeVisible();

    for (const tile of await page.locator(".ph4-tile").all()) {
      const box = await tile.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x + box!.width).toBeLessThanOrEqual(390.5);
    }

    const viewAll = page.locator(".ph4-section__link", { hasText: "View all" });
    await expect(viewAll.first()).toBeVisible();
    const viewAllBox = await viewAll.first().boundingBox();
    expect(viewAllBox).not.toBeNull();
    expect(viewAllBox!.x + viewAllBox!.width).toBeLessThanOrEqual(390.5);

    await page.screenshot({
      path: path.join(artifactDir, "premium-home-v4-390x844-viewport.png"),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(artifactDir, "premium-home-v4-390x844-full.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector(".premium-home-v4");
    await page.waitForFunction(() => {
      const doc = document.documentElement;
      return doc.scrollWidth <= doc.clientWidth + 1;
    });
    await page.waitForFunction(
      () => {
        const imgs = Array.from(
          document.querySelectorAll(".premium-home-v4 img"),
        ) as HTMLImageElement[];
        return (
          imgs.length >= 6 &&
          imgs.every((img) => img.complete && img.naturalWidth > 0)
        );
      },
      undefined,
      { timeout: 60_000 },
    );

    for (const tile of await page.locator(".ph4-tile").all()) {
      const box = await tile.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x + box!.width).toBeLessThanOrEqual(430.5);
    }

    const viewAll430 = page.locator(".ph4-section__link", { hasText: "View all" });
    const viewAll430Box = await viewAll430.first().boundingBox();
    expect(viewAll430Box).not.toBeNull();
    expect(viewAll430Box!.x + viewAll430Box!.width).toBeLessThanOrEqual(430.5);

    await page.screenshot({
      path: path.join(artifactDir, "premium-home-v4-430x932-viewport.png"),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(artifactDir, "premium-home-v4-430x932-full.png"),
      fullPage: true,
    });
  });
});
