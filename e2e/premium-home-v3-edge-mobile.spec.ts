import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { signInForCommunityScreenshots } from "./helpers/community-screenshot-auth";

const artifactDir = path.join(process.cwd(), "docs/premium-home-v3-edge-screenshots");

const VIEWPORTS = [
  { width: 360, height: 800, tag: "360x800" },
  { width: 390, height: 844, tag: "390x844" },
  { width: 412, height: 915, tag: "412x915" },
  { width: 430, height: 932, tag: "430x932" },
] as const;

async function measureLayout(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const shell = document.querySelector(".premium-home-v3.premium-home-v4");
    const hero = document.querySelector(".ph4-hero--v3");
    const thumb = document.querySelector(".ph4-sermon--stack .ph4-sermon__thumb");
    const sermon = document.querySelector(".ph4-sermon--stack");
    const vw = window.innerWidth;
    const shellRect = shell?.getBoundingClientRect();
    const heroRect = hero?.getBoundingClientRect();
    const thumbRect = thumb?.getBoundingClientRect();
    const sermonRect = sermon?.getBoundingClientRect();
    const heroGutters =
      heroRect != null
        ? {
            left: Math.round(heroRect.left),
            right: Math.round(vw - heroRect.right),
          }
        : null;
    const mainContentWidth = heroRect ? Math.round(heroRect.width) : 0;
    return {
      viewportWidth: vw,
      contentWidth: mainContentWidth,
      gutters: heroGutters,
      hero: heroRect
        ? { width: Math.round(heroRect.width), height: Math.round(heroRect.height) }
        : null,
      sermonThumb: thumbRect
        ? {
            width: Math.round(thumbRect.width),
            height: Math.round(thumbRect.height),
            aspect: +(thumbRect.width / thumbRect.height).toFixed(2),
          }
        : null,
      sermonPanelWidth: sermonRect ? Math.round(sermonRect.width) : 0,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });
}

test.describe("Premium Home V3 edge-to-edge geometry", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactDir, { recursive: true });
  });

  for (const vp of VIEWPORTS) {
    test(`geometry ${vp.tag}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".premium-home-v3", { timeout: 90_000 });
      await page.waitForFunction(() => document.body.classList.contains("premium-home-v3-active"));

      const m = await measureLayout(page);
      console.info(`EDGE_LAYOUT_${vp.tag}`, JSON.stringify(m));

      expect(m.scrollWidth).toBeLessThanOrEqual(m.clientWidth + 1);
      expect(m.gutters?.left ?? 99).toBeGreaterThanOrEqual(8);
      expect(m.gutters?.left ?? 0).toBeLessThanOrEqual(14);
      expect(m.gutters?.right ?? 99).toBeGreaterThanOrEqual(8);
      expect(m.gutters?.right ?? 0).toBeLessThanOrEqual(14);
      expect(m.contentWidth).toBeGreaterThanOrEqual(vp.width - 28);
      expect(m.hero?.width ?? 0).toBe(vp.width - (m.gutters?.left ?? 0) - (m.gutters?.right ?? 0));
      expect(m.hero?.height ?? 0).toBeGreaterThan(vp.height * 0.14);
      expect(m.sermonThumb?.width ?? 0).toBeGreaterThanOrEqual(m.sermonPanelWidth * 0.92);
      expect(m.sermonThumb?.aspect ?? 0).toBeGreaterThan(1.5);
      expect(m.sermonThumb?.aspect ?? 99).toBeLessThan(1.95);

      await page.screenshot({
        path: path.join(artifactDir, `premium-home-v3-edge-full-${vp.tag}.png`),
        fullPage: true,
      });
      await page.locator(".ph4-hero--v3").screenshot({
        path: path.join(artifactDir, `premium-home-v3-edge-hero-${vp.tag}.png`),
      });
      await page.locator(".ph4-section:has(.ph4-sermon)").screenshot({
        path: path.join(artifactDir, `premium-home-v3-edge-sermon-${vp.tag}.png`),
      });
      await page.locator(".ph4-section:has(.ph4-events)").screenshot({
        path: path.join(artifactDir, `premium-home-v3-edge-events-${vp.tag}.png`),
      });
    });
  }
});

test.describe("Premium Home V3 signed-in Samsung bottom gap", () => {
  test.skip(process.env.PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES !== "1", "Requires disposable synthetic QA fixture");

  test("412x915 gap 20-40px", async ({ page }) => {
    if (!process.env.PLAYWRIGHT_COMMUNITY_EMAIL || !process.env.PLAYWRIGHT_COMMUNITY_PASSWORD) {
      throw new Error("Synthetic QA credentials are required");
    }
    await page.setViewportSize({ width: 412, height: 915 });
    expect(await signInForCommunityScreenshots(page)).toBe(true);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".premium-home-v3__balance-lower", { timeout: 90_000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
    });
    const layout = await measureLayout(page);
    const metrics = await page.evaluate(() => {
      const lower = document.querySelector(".premium-home-v3__balance-lower");
      const nav = document.querySelector(".mobile-bottom-nav");
      if (!(lower instanceof HTMLElement) || !(nav instanceof HTMLElement)) throw new Error("Missing lower content or nav");
      const cta = lower.lastElementChild instanceof HTMLElement ? lower.lastElementChild : lower;
      const ctaRect = cta.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      return {
        gapPx: Math.round(navRect.top - ctaRect.bottom),
        ctaBottom: Math.round(ctaRect.bottom),
        navTop: Math.round(navRect.top),
      };
    });
    Object.assign(metrics, { layout });
    console.info("EDGE_SAMSUNG_GAP", JSON.stringify(metrics));
    expect(metrics.gapPx).toBeGreaterThanOrEqual(20);
    expect(metrics.gapPx).toBeLessThanOrEqual(40);
    await page.screenshot({
      path: path.join(artifactDir, "premium-home-v3-edge-samsung-signed-in-bottom-412x915.png"),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(artifactDir, "premium-home-v3-edge-samsung-signed-in-full-412x915.png"),
      fullPage: true,
    });
  });
});