/**
 * Captures V4.1 homepage screenshots into docs/premium-homepage-v4-screenshots/
 * Usage: node scripts/capture-premium-v41-screenshots.mjs [baseUrl]
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";

const base = (process.argv[2] || "http://localhost:3010").replace(/\/$/, "");
const outDir = path.join(process.cwd(), "docs", "premium-homepage-v4-screenshots");

const shots = [
  { name: "church-desktop-1440", url: "/church-site", width: 1440, height: 900 },
  { name: "church-mobile-390", url: "/church-site", width: 390, height: 844 },
  { name: "app-desktop-light-1280", url: "/", width: 1280, height: 900 },
  { name: "app-mobile-light-390-signed-out", url: "/", width: 390, height: 844 },
  { name: "app-mobile-dark-390-signed-out", url: "/", width: 390, height: 844, dark: true },
  { name: "app-desktop-dark-1280", url: "/", width: 1280, height: 900, dark: true },
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await puppeteer.launch({ headless: true });
  for (const shot of shots) {
    const page = await browser.newPage();
    await page.setViewport({ width: shot.width, height: shot.height, deviceScaleFactor: 1 });
    if (shot.dark) {
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
      await page.evaluateOnNewDocument(() => {
        document.documentElement.classList.add("dark");
      });
    }
    await page.goto(`${base}${shot.url}`, { waitUntil: "networkidle2", timeout: 120_000 });
    await page.waitForTimeout(1800);
    const file = path.join(outDir, `${shot.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log("saved", file);
    await page.close();
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});