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

const WIDTH = 1284;
const HEIGHT = 2778;
const HEADER = 420;

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function headerSvg(caption, subtitle) {
  return Buffer.from(`
    <svg width="${WIDTH}" height="${HEADER}" xmlns="http://www.w3.org/2000/svg">
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
      <rect width="${WIDTH}" height="${HEADER}" fill="url(#bg)"/>
      <rect width="${WIDTH}" height="${HEADER}" fill="url(#glow)"/>
      <text x="72" y="170" fill="#fde68a" font-family="Georgia, serif" font-size="34" font-weight="700">Shanah City</text>
      <text x="72" y="250" fill="#ffffff" font-family="Georgia, serif" font-size="62" font-weight="700">${escapeXml(caption)}</text>
      <text x="72" y="320" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="34">${escapeXml(subtitle)}</text>
    </svg>
  `);
}

async function composeScreen({ slug, caption, subtitle }) {
  const rawPath = path.join(IN_DIR, `${slug}-raw.png`);
  if (!fs.existsSync(rawPath)) {
    console.warn(`Skip ${slug}: missing ${rawPath}`);
    return;
  }

  const phoneHeight = HEIGHT - HEADER;
  const resizedPhone = await sharp(rawPath)
    .resize(WIDTH, phoneHeight, { fit: "cover", position: "top" })
    .png()
    .toBuffer();

  const outputPath = path.join(OUT_DIR, `${slug}-1284x2778.png`);
  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: "#faf8f5",
    },
  })
    .composite([
      { input: headerSvg(caption, subtitle), top: 0, left: 0 },
      { input: resizedPhone, top: HEADER, left: 0 },
    ])
    .png()
    .toFile(outputPath);

  const altPath = path.join(OUT_DIR, `${slug}-1242x2688.png`);
  await sharp(outputPath)
    .resize(1242, 2688, { fit: "fill" })
    .png()
    .toFile(altPath);

  console.log(`Created ${outputPath}`);
  console.log(`Created ${altPath}`);
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
