const puppeteer = require("puppeteer");
const path = require("path");

(async () => {
  const htmlPath = path.resolve(__dirname, "render-featured-graphic.html");
  const outputPath = path.resolve(__dirname, "../public/featured-graphic-1024x500.png");
  const fileUrl = `file:///${htmlPath.replace(/\\/g, "/")}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 });
    await page.goto(fileUrl, { waitUntil: "networkidle0" });
    await page.screenshot({
      path: outputPath,
      type: "png",
      clip: { x: 0, y: 0, width: 1024, height: 500 },
    });
    console.log(`Created ${outputPath}`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
