const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE_URL = process.env.SCREENSHOT_BASE_URL || "https://shanah-city.vercel.app";
const OUT_DIR = path.resolve(__dirname, "../public/app-store-screenshots");

const VIEWPORT = { width: 428, height: 926 };
const DEVICE_SCALE = 3;

const screens = [
  { slug: "01-home", path: "/", waitFor: ".mobile-home", caption: "Your church home" },
  { slug: "02-media", path: "/live", waitFor: "h1", caption: "Watch live worship" },
  { slug: "03-devotions", path: "/devotions", waitFor: "h1", caption: "Daily devotions" },
  { slug: "04-community", path: "/community", waitFor: "h1", caption: "Prayer & community" },
  { slug: "05-calendar", path: "/calendar", waitFor: "h1", caption: "Church calendar" },
  { slug: "06-connect", path: "/connect", waitFor: "h1", caption: "Plan your visit" },
  { slug: "07-give", path: "/give", waitFor: "h1", caption: "Give securely" },
  { slug: "08-groups", path: "/groups", waitFor: "h1", caption: "Join a group" },
  { slug: "09-campuses", path: "/campuses", waitFor: "h1", caption: "Aurora · Accra · Online" },
  { slug: "10-meetings", path: "/meetings", waitFor: "h1", caption: "Meetings & events" },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  });

  try {
    for (const screen of screens) {
      const page = await context.newPage();
      const rawPath = path.join(OUT_DIR, `${screen.slug}-raw.png`);

      try {
        await page.goto(`${BASE_URL}${screen.path}`, {
          waitUntil: "networkidle",
          timeout: 60000,
        });
        await page.waitForSelector('body[data-shell="mobile"]', { timeout: 15000 });
        await page.waitForSelector(screen.waitFor, { timeout: 15000 });
        await page.waitForTimeout(1200);
        await page.screenshot({ path: rawPath, type: "png", fullPage: false });
        console.log(`Captured ${rawPath}`);
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
