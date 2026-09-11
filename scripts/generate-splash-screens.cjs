const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const LOGO = path.resolve(__dirname, "../public/shanah-city-logo-light.png");
const BACKGROUND = { r: 250, g: 247, b: 242, alpha: 1 }; // #faf7f2
const BACKGROUND_ONLY = process.argv.includes("--background-only");

const IOS_SPLASH_DIR = path.resolve(
  __dirname,
  "../ios/App/App/Assets.xcassets/Splash.imageset",
);
const ANDROID_RES = path.resolve(__dirname, "../android/app/src/main/res");
const MOBILE_WWW = path.resolve(__dirname, "../mobile/www");

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

async function buildLogoBuffer(maxSize) {
  return sharp(LOGO)
    .resize(maxSize, maxSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function writeSplash(width, height, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  if (BACKGROUND_ONLY) {
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: BACKGROUND,
      },
    })
      .png()
      .toFile(outputPath);
    console.log(`Created ${outputPath} (${width}x${height}, background only)`);
    return;
  }

  const logoMax = Math.round(Math.min(width, height) * 0.42);
  const logo = await buildLogoBuffer(logoMax);

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

async function writeAndroidSplashLogo() {
  const canvas = 432;
  const logo = await buildLogoBuffer(Math.round(canvas * 0.68));
  const outputPath = path.join(ANDROID_RES, "drawable/splash_logo.png");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  await sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(outputPath);

  console.log(`Created ${outputPath} (${canvas}x${canvas}, Android 12 splash icon)`);
}

async function writeMobileShellAssets() {
  const logo = await buildLogoBuffer(280);
  fs.mkdirSync(MOBILE_WWW, { recursive: true });
  await sharp(logo).toFile(path.join(MOBILE_WWW, "shanah-city-logo-light.png"));
  console.log(`Created ${path.join(MOBILE_WWW, "shanah-city-logo-light.png")}`);
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

  if (!BACKGROUND_ONLY) {
    await writeAndroidSplashLogo();
    await writeMobileShellAssets();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
