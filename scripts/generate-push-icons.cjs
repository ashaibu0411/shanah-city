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

  await sharp(SOURCE)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .grayscale()
    .normalize()
    .threshold(128)
    .negate()
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
