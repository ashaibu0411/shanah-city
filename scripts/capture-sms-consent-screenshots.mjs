/**
 * Twilio reviewers: synthetic data only.
 * Usage: node scripts/capture-sms-consent-screenshots.mjs [baseUrl]
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";

const base = (process.argv[2] || "http://localhost:3010").replace(/\/$/, "");
const outDir = path.join(process.cwd(), "docs", "twilio-a2p-screenshots");
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
const extraHeaders = bypass ? { "x-vercel-protection-bypass": bypass } : {};

const shots = [
  { name: "sms-consent-desktop", url: "/sms-consent", width: 1280, height: 1400 },
  { name: "sms-consent-mobile", url: "/sms-consent", width: 390, height: 1200 },
  { name: "privacy-sms-section", url: "/privacy", width: 1280, height: 1600 },
  { name: "terms-sms-section", url: "/terms", width: 1280, height: 1400 },
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await puppeteer.launch({ headless: true });
  for (const shot of shots) {
    const page = await browser.newPage();
    if (Object.keys(extraHeaders).length) await page.setExtraHTTPHeaders(extraHeaders);
    await page.setViewport({ width: shot.width, height: shot.height });
    await page.goto(`${base}${shot.url}`, { waitUntil: "networkidle2", timeout: 120_000 });
    const file = path.join(outDir, `${shot.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log("saved", file);
    await page.close();
  }
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});