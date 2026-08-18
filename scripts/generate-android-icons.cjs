const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SOURCE = path.resolve(__dirname, "../public/app-icon-512.png");
const RES_DIR = path.resolve(__dirname, "../android/app/src/main/res");

const densities = {
  "mipmap-mdpi": { launcher: 48, foreground: 108 },
  "mipmap-hdpi": { launcher: 72, foreground: 162 },
  "mipmap-xhdpi": { launcher: 96, foreground: 216 },
  "mipmap-xxhdpi": { launcher: 144, foreground: 324 },
  "mipmap-xxxhdpi": { launcher: 192, foreground: 432 },
};

async function writeSquareIcon(size, outputPath, paddingRatio = 0.08) {
  const padding = Math.round(size * paddingRatio);
  const inner = size - padding * 2;
  const resized = await sharp(SOURCE)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([{ input: resized, gravity: "center" }])
    .png()
    .toFile(outputPath);
}

async function main() {
  for (const [folder, sizes] of Object.entries(densities)) {
    const dir = path.join(RES_DIR, folder);
    fs.mkdirSync(dir, { recursive: true });

    await writeSquareIcon(sizes.launcher, path.join(dir, "ic_launcher.png"));
    await writeSquareIcon(sizes.launcher, path.join(dir, "ic_launcher_round.png"));
    await writeSquareIcon(sizes.foreground, path.join(dir, "ic_launcher_foreground.png"), 0.1);

    console.log(`Updated ${folder}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
