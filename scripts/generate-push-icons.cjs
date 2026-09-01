const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SOURCE = path.resolve(__dirname, "../public/shanah-city-logo.png");
const BADGE_OUTPUT = path.resolve(__dirname, "../public/push-badge-96.png");
const ANDROID_RES = path.resolve(__dirname, "../android/app/src/main/res");

async function writeBadge() {
  await sharp(SOURCE)
    .resize(96, 96, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(BADGE_OUTPUT);
  console.log(`Created ${BADGE_OUTPUT}`);
}

async function writeAndroidNotificationIcon(size, folder) {
  const outputDir = path.join(ANDROID_RES, folder);
  fs.mkdirSync(outputDir, { recursive: true });
  const output = path.join(outputDir, "ic_stat_shanah.png");

  // Android status-bar icons must be a white silhouette on a transparent background.
  // The source logo is white on black; map bright pixels to opaque white, everything else transparent.
  const { data, info } = await sharp(SOURCE)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const lum = (r + g + b) / 3;
    const visible = a > 16 && lum > 128;
    out[i] = 255;
    out[i + 1] = 255;
    out[i + 2] = 255;
    out[i + 3] = visible ? 255 : 0;
  }

  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(output);

  console.log(`Created ${output}`);
}

async function main() {
  await writeBadge();
  await writeAndroidNotificationIcon(24, "drawable-mdpi");
  await writeAndroidNotificationIcon(36, "drawable-hdpi");
  await writeAndroidNotificationIcon(48, "drawable-xhdpi");
  await writeAndroidNotificationIcon(72, "drawable-xxhdpi");
  await writeAndroidNotificationIcon(96, "drawable-xxxhdpi");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
