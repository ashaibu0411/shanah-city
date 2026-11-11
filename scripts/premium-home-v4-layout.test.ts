import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const mobile = readFileSync(
  path.join(process.cwd(), "src/components/home/premium/PremiumHomeMobile.tsx"),
  "utf8",
);
assert.match(mobile, /PremiumHomeV4Hero/);
assert.match(mobile, /PremiumHomeV4QuickTiles/);
assert.match(mobile, /PremiumHomeV4GiveBar/);
assert.match(mobile, /premium-home-v4/);
assert.doesNotMatch(mobile, /PremiumMobileLauncher/);

const css = readFileSync(path.join(process.cwd(), "src/app/premium-home-v4.css"), "utf8");
assert.match(css, /#061329/);
assert.match(css, /#512d83/i);
assert.match(css, /#e9bc72/i);
assert.match(css, /premium-home-v4-active/);

const header = readFileSync(
  path.join(process.cwd(), "src/components/app/MobileAppHeader.tsx"),
  "utf8",
);
assert.match(header, /BrandLogo size="sm" variant="dark"/);

const tiles = readFileSync(
  path.join(process.cwd(), "src/lib/home-premium-v4.ts"),
  "utf8",
);
assert.match(tiles, /Worship Live/);
assert.match(tiles, /premium-v4-mountain-hero/);
assert.match(tiles, /label: "Daily Devotions"/);
assert.match(tiles, /label: "Events"/);

console.log("premium-home-v4-layout.test.ts OK");
