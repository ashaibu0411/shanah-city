const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE_URL = process.env.SCREENSHOT_BASE_URL || "https://shanah-city.vercel.app";
const OUT_DIR = path.resolve(__dirname, "../public/play-store-screenshots");
const VIEWPORT = { width: 1023, height: 1822 };

const screens = [
  { slug: "01-home", path: "/", waitFor: ".mobile-home" },
  { slug: "02-media", path: "/live", waitFor: "h1" },
  { slug: "03-devotions", path: "/devotions", waitFor: "h1" },
  { slug: "04-community", path: "/community", waitFor: "h1" },
  { slug: "05-calendar", path: "/calendar", waitFor: "h1" },
  { slug: "06-connect", path: "/connect", waitFor: "h1" },
  { slug: "07-give", path: "/give", waitFor: "h1" },
  { slug: "08-campuses", path: "/campuses", waitFor: "h1" },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  });

  try {
    for (const screen of screens) {
      const page = await context.newPage();
      const url = `${BASE_URL}${screen.path}`;

      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
        await page.waitForSelector('body[data-shell="mobile"]', { timeout: 15000 });
        await page.waitForSelector(screen.waitFor, { timeout: 15000 });
        await page.waitForTimeout(1200);

        const output = path.join(OUT_DIR, `${screen.slug}.png`);
        await page.screenshot({ path: output, type: "png", fullPage: false });
        console.log(`Saved ${output}`);
      } catch (error) {
        console.error(`Failed ${screen.slug}: ${error.message}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
