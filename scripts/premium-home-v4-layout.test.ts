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

const bodyStart = mobile.indexOf("premium-home-v4 animate-fade-in");
assert.ok(bodyStart >= 0, "premium-home-v4 shell missing");
const body = mobile.slice(bodyStart);
const heroIdx = body.indexOf("PremiumHomeV4Hero");
const tilesIdx = body.indexOf("PremiumHomeV4QuickTiles");
const giveIdx = body.indexOf("PremiumHomeV4GiveBar");
const eventsIdx = body.indexOf("PremiumHomeV4UpcomingEvents");
const sermonIdx = body.indexOf("PremiumHomeV4LatestSermon");
const communityIdx = body.indexOf("PremiumHomeV4Community");
const engagementIdx = body.indexOf("PremiumEngagementRail");
assert.ok(
  heroIdx < tilesIdx &&
    tilesIdx < giveIdx &&
    giveIdx < eventsIdx &&
    eventsIdx < sermonIdx &&
    sermonIdx < communityIdx &&
    communityIdx < engagementIdx,
  "V4 sections must follow hero → tiles → give → events → sermon → community → secondary rails",
);

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
