import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const mobile = readFileSync(
  path.join(process.cwd(), "src/components/home/premium/PremiumHomeMobile.tsx"),
  "utf8",
);
assert.match(mobile, /PremiumHomeV3Chrome/);
assert.match(mobile, /premium-home-v3/);
assert.match(mobile, /PremiumHomeV4Hero/);
assert.match(mobile, /heroV3/);
assert.match(mobile, /storiesPresentation="v6"/);
assert.match(mobile, /homeV3/);
assert.match(mobile, /PremiumHomeV3QuickTiles/);
assert.doesNotMatch(mobile, /PremiumHomeV4Community/);
assert.doesNotMatch(mobile, /PremiumEngagementRail/);
assert.doesNotMatch(mobile, /PremiumHomeV2Chrome/);

const bodyStart = mobile.indexOf("premium-home-v3 premium-home-v4 animate-fade-in");
assert.ok(bodyStart >= 0, "premium home v3 shell missing");
const body = mobile.slice(bodyStart);
const storiesIdx = body.indexOf("PremiumStoriesSection");
const heroIdx = body.indexOf("PremiumHomeV4Hero");
const tilesIdx = body.indexOf("PremiumHomeV3QuickTiles");
const giveIdx = body.indexOf("PremiumHomeV4GiveBar");
const sermonIdx = body.indexOf("PremiumHomeV4LatestSermon");
const checkInIdx = body.indexOf("CheckInHomeBanner");
assert.ok(
  storiesIdx < heroIdx &&
    heroIdx < tilesIdx &&
    tilesIdx < giveIdx &&
    giveIdx < sermonIdx &&
    sermonIdx < checkInIdx,
  "V3 sections must follow stories → hero → tiles → give → events → sermon → check-in",
);

const v3css = readFileSync(path.join(process.cwd(), "src/app/premium-home-v3.css"), "utf8");
assert.match(v3css, /premium-home-v3-active/);
assert.match(v3css, /--home-v3-gold:\s*#f6c66b/);

const globals = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
assert.match(globals, /premium-home-v3\.css/);

const tiles = readFileSync(path.join(process.cwd(), "src/lib/home-premium-v3.ts"), "utf8");
assert.match(tiles, /Get Connected/);
assert.match(tiles, /Worship Live/);

const nav = readFileSync(path.join(process.cwd(), "src/lib/mobile-primary-nav-tabs.ts"), "utf8");
assert.doesNotMatch(nav, /site\.nav\[4\]/);
assert.match(nav, /premiumV3BottomNavTabs/);

console.log("premium-home-v3-layout.test.ts OK");
