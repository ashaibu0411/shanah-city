const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const LOGO = path.resolve(__dirname, "../public/shanah-city-logo.png");
const BACKGROUND = { r: 250, g: 248, b: 245, alpha: 1 }; // #faf8f5

const IOS_SPLASH_DIR = path.resolve(
  __dirname,
  "../ios/App/App/Assets.xcassets/Splash.imageset",
);
const ANDROID_RES = path.resolve(__dirname, "../android/app/src/main/res");

const androidSplashes = {
  "drawable/splash.png": { width: 480, height: 800 },
  "drawable-port-mdpi/splash.png": { width: 320, height: 480 },
  "drawable-port-hdpi/splash.png": { width: 480, height: 800 },
  "drawable-port-xhdpi/splash.png": { width: 720, height: 1280 },
  "drawable-port-xxhdpi/splash.png": { width: 960, height: 1600 },
  "drawable-port-xxxhdpi/splash.png": { width: 1280, height: 1920 },
  "drawable-land-mdpi/splash.png": { width: 480, height: 320 },
  "drawable-land-hdpi/splash.png": { width: 800, height: 480 },
  "drawable-land-xhdpi/splash.png": { width: 1280, height: 720 },
  "drawable-land-xxhdpi/splash.png": { width: 1600, height: 960 },
  "drawable-land-xxxhdpi/splash.png": { width: 1920, height: 1280 },
};

async function writeSplash(width, height, outputPath) {
  const logoMax = Math.round(Math.min(width, height) * 0.42);
  const logo = await sharp(LOGO)
    .resize(logoMax, logoMax, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(outputPath);

  console.log(`Created ${outputPath} (${width}x${height})`);
}

async function main() {
  const iosFiles = [
    "splash-2732x2732.png",
    "splash-2732x2732-1.png",
    "splash-2732x2732-2.png",
  ];
  for (const file of iosFiles) {
    await writeSplash(2732, 2732, path.join(IOS_SPLASH_DIR, file));
  }

  for (const [relativePath, size] of Object.entries(androidSplashes)) {
    await writeSplash(size.width, size.height, path.join(ANDROID_RES, relativePath));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
