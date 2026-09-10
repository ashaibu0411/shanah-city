const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SOURCE_MASTER = path.resolve(__dirname, "../public/shanah-city-logo-source.jpg");
const SOURCE_FALLBACK = path.resolve(__dirname, "../public/shanah-city-logo.png");
const PUBLIC = path.resolve(__dirname, "../public");

const OUTPUTS = {
  light: path.join(PUBLIC, "shanah-city-logo-light.png"),
  dark: path.join(PUBLIC, "shanah-city-logo-dark.png"),
  default: path.join(PUBLIC, "shanah-city-logo.png"),
};

const INK = { r: 45, g: 36, b: 24 }; // night-900 ink for light backgrounds

function resolveSource() {
  if (!fs.existsSync(SOURCE_MASTER) && fs.existsSync(SOURCE_FALLBACK)) {
    fs.copyFileSync(SOURCE_FALLBACK, SOURCE_MASTER);
    console.log(`Archived master logo to ${SOURCE_MASTER}`);
  }
  if (fs.existsSync(SOURCE_MASTER)) return SOURCE_MASTER;
  if (fs.existsSync(SOURCE_FALLBACK)) return SOURCE_FALLBACK;
  throw new Error("Missing logo source file.");
}

async function buildVariant(mode, sourcePath) {
  const { data, info } = await sharp(sourcePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = (r + g + b) / 3;

    if (lum < 96) {
      out[i] = 0;
      out[i + 1] = 0;
      out[i + 2] = 0;
      out[i + 3] = 0;
      continue;
    }

    if (mode === "dark") {
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
    } else {
      out[i] = INK.r;
      out[i + 1] = INK.g;
      out[i + 2] = INK.b;
    }
    out[i + 3] = 255;
  }

  return sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png();
}

async function main() {
  const source = resolveSource();
  const light = await buildVariant("light", source);
  const dark = await buildVariant("dark", source);

  await light.toFile(OUTPUTS.light);
  await dark.toFile(OUTPUTS.dark);
  await light.toFile(OUTPUTS.default);

  console.log(`Created ${OUTPUTS.light}`);
  console.log(`Created ${OUTPUTS.dark}`);
  console.log(`Updated ${OUTPUTS.default} (transparent PNG for light UI)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
