const path = require("path");
const sharp = require("sharp");

const SOURCE = path.resolve(__dirname, "../public/app-icon-512.png");
const OUTPUT = path.resolve(
  __dirname,
  "../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
);

sharp(SOURCE)
  .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
  .png()
  .toFile(OUTPUT)
  .then((info) => {
    console.log(`Created ${OUTPUT} (${info.width}x${info.height})`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
