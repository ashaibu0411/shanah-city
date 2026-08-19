const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const IN_DIR = path.resolve(__dirname, "../public/app-store-screenshots");
const OUT_DIR = IN_DIR;

const screens = [
  { slug: "01-home", caption: "Your church home", subtitle: "Shanah City" },
  { slug: "02-media", caption: "Watch live worship", subtitle: "YouTube & Facebook in-app" },
  { slug: "03-devotions", caption: "Daily devotions", subtitle: "Grow in God's Word" },
  { slug: "04-community", caption: "Prayer & community", subtitle: "Share and connect" },
  { slug: "05-calendar", caption: "Church calendar", subtitle: "Never miss a service" },
  { slug: "06-connect", caption: "Plan your visit", subtitle: "Aurora · Accra · Online" },
  { slug: "07-give", caption: "Give securely", subtitle: "Support the ministry" },
  { slug: "08-groups", caption: "Join a group", subtitle: "Find your people" },
  { slug: "09-campuses", caption: "Three campuses", subtitle: "Colorado · Ghana · Worldwide" },
  { slug: "10-meetings", caption: "Meetings & events", subtitle: "Stay in the loop" },
];

const PHONE_WIDTH = 1284;
const PHONE_HEADER = 420;

const IPAD_SIZES = [
  { width: 2048, height: 2732, suffix: "2048x2732" },
  { width: 2064, height: 2752, suffix: "2064x2752" },
];

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function headerSvg(width, headerHeight, caption, subtitle) {
  const scale = width / PHONE_WIDTH;
  const padX = Math.round(72 * scale);
  const brandY = Math.round(170 * (headerHeight / PHONE_HEADER));
  const captionY = Math.round(250 * (headerHeight / PHONE_HEADER));
  const subtitleY = Math.round(320 * (headerHeight / PHONE_HEADER));
  const brandSize = Math.round(34 * scale);
  const captionSize = Math.round(62 * scale);
  const subtitleSize = Math.round(34 * scale);

  return Buffer.from(`
    <svg width="${width}" height="${headerHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="45%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#312e81"/>
        </linearGradient>
        <radialGradient id="glow" cx="20%" cy="20%" r="60%">
          <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#fbbf24" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${width}" height="${headerHeight}" fill="url(#bg)"/>
      <rect width="${width}" height="${headerHeight}" fill="url(#glow)"/>
      <text x="${padX}" y="${brandY}" fill="#fde68a" font-family="Georgia, serif" font-size="${brandSize}" font-weight="700">Shanah City</text>
      <text x="${padX}" y="${captionY}" fill="#ffffff" font-family="Georgia, serif" font-size="${captionSize}" font-weight="700">${escapeXml(caption)}</text>
      <text x="${padX}" y="${subtitleY}" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="${subtitleSize}">${escapeXml(subtitle)}</text>
    </svg>
  `);
}

async function composeScreenForSize(screen, size) {
  const rawPath = path.join(IN_DIR, `${screen.slug}-raw.png`);
  if (!fs.existsSync(rawPath)) {
    console.warn(`Skip ${screen.slug}: missing ${rawPath}`);
    return;
  }

  const { width, height, suffix } = size;
  const headerHeight = Math.round(PHONE_HEADER * (width / PHONE_WIDTH));
  const contentHeight = height - headerHeight;

  const resizedPhone = await sharp(rawPath)
    .resize(width, contentHeight, { fit: "cover", position: "top" })
    .png()
    .toBuffer();

  const outputPath = path.join(OUT_DIR, `${screen.slug}-${suffix}.png`);
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: "#faf8f5",
    },
  })
    .composite([
      { input: headerSvg(width, headerHeight, screen.caption, screen.subtitle), top: 0, left: 0 },
      { input: resizedPhone, top: headerHeight, left: 0 },
    ])
    .png()
    .toFile(outputPath);

  console.log(`Created ${outputPath}`);
}

async function composeScreen(screen) {
  for (const size of IPAD_SIZES) {
    await composeScreenForSize(screen, size);
  }
}

async function main() {
  for (const screen of screens) {
    await composeScreen(screen);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
