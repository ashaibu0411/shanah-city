/**
 * Renders public/training/choir-worship-leader.html → choir-worship-leader-guide.pdf
 * Run: npm run training:choir-pdf
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = path.join(root, "public/training/choir-worship-leader.html");
const pdfPath = path.join(root, "public/training/choir-worship-leader-guide.pdf");
const htmlUrl = `file://${htmlPath.replace(/\\/g, "/")}`;

const browser = await puppeteer.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(htmlUrl, { waitUntil: "networkidle0", timeout: 60_000 });
  await page.emulateMediaType("print");
  await page.pdf({
    path: pdfPath,
    format: "Letter",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: "0.25in", right: "0.25in", bottom: "0.25in", left: "0.25in" },
  });
  console.log(`Wrote ${pdfPath}`);
} finally {
  await browser.close();
}
