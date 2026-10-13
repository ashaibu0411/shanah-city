/**
 * Sync MARKETING_VERSION and CURRENT_PROJECT_VERSION in the Xcode project from env.
 * Used in CI after cap sync so TestFlight always gets the intended version strings.
 */
const fs = require("fs");
const path = require("path");

const marketing = (process.env.MARKETING_VERSION || "").trim();
const build = (process.env.IOS_BUILD_NUMBER || "").trim();
const pbxPath = path.join(__dirname, "../ios/App/App.xcodeproj/project.pbxproj");

if (!marketing) {
  console.error("MARKETING_VERSION is required.");
  process.exit(1);
}
if (!build) {
  console.error("IOS_BUILD_NUMBER is required.");
  process.exit(1);
}
if (!fs.existsSync(pbxPath)) {
  console.error("Missing Xcode project:", pbxPath);
  process.exit(1);
}

let content = fs.readFileSync(pbxPath, "utf8");
content = content.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${marketing};`);
content = content.replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${build};`);
fs.writeFileSync(pbxPath, content);

console.log(`Set MARKETING_VERSION=${marketing}, CURRENT_PROJECT_VERSION=${build}`);
