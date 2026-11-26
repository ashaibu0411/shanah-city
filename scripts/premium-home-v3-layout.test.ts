import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const mobile = readFileSync(
  path.join(process.cwd(), "src/components/home/premium/PremiumHomeMobile.tsx"),
  "utf8",
);
assert.match(mobile, /PremiumHomeV4Chrome/);
assert.match(mobile, /premium-home-v4/);
assert.match(mobile, /PremiumHomeV4Hero/);
assert.match(mobile, /storiesPresentation="v6"/);
assert.match(mobile, /homeV3/);
assert.match(mobile, /PremiumHomeV4QuickTiles/);
assert.doesNotMatch(mobile, /PremiumHomeV4Community/);
assert.doesNotMatch(mobile, /PremiumEngagementRail/);

const v3css = readFileSync(path.join(process.cwd(), "src/app/premium-home-v3.css"), "utf8");
assert.match(v3css, /premium-home-v3-active/);

const globals = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
assert.match(globals, /premium-home-v3\.css/);

const nav = readFileSync(path.join(process.cwd(), "src/lib/mobile-primary-nav-tabs.ts"), "utf8");
assert.match(nav, /premiumV3BottomNavTabs/);

console.log("premium-home-v3-layout.test.ts OK (V4 mobile home; legacy V3 CSS retained)");