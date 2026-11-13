import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const mobile = readFileSync(
  path.join(process.cwd(), "src/components/home/premium/PremiumHomeMobile.tsx"),
  "utf8",
);
assert.match(mobile, /PremiumHomeV4Hero/);
assert.match(mobile, /PremiumHomeV4GiveBar/);
assert.match(mobile, /premium-home-v4/);
assert.doesNotMatch(mobile, /PremiumMobileLauncher/);

const bodyStart = mobile.indexOf("premium-home-v3 premium-home-v4 animate-fade-in");
assert.ok(bodyStart >= 0, "premium home mobile shell missing");
const body = mobile.slice(bodyStart);
const storiesIdx = body.indexOf("PremiumStoriesSection");
const heroIdx = body.indexOf("PremiumHomeV4Hero");
const tilesIdx = body.indexOf("PremiumHomeV3QuickTiles");
const giveIdx = body.indexOf("PremiumHomeV4GiveBar");
const eventsIdx = body.indexOf("PremiumHomeV4UpcomingEvents");
const sermonIdx = body.indexOf("PremiumHomeV4LatestSermon");
const checkInIdx = body.indexOf("CheckInHomeBanner");
assert.ok(
  storiesIdx < heroIdx &&
    heroIdx < tilesIdx &&
    tilesIdx < giveIdx &&
    giveIdx < eventsIdx &&
    eventsIdx < sermonIdx &&
    sermonIdx < checkInIdx,
  "mobile home must follow stories → hero → tiles → give → events → sermon → check-in",
);
assert.doesNotMatch(mobile, /PremiumHomeV4Community/);

const css = readFileSync(path.join(process.cwd(), "src/app/premium-home-v4.css"), "utf8");
assert.match(css, /premium-home-v4-active/);
assert.match(css, /\.ph4-section\s*\{[^}]*width:\s*auto;/s, "V4 sections must shrink inside the parent side margins");

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
assert.match(tiles, /premium-v4-devotions-bible/);

console.log("premium-home-v4-layout.test.ts OK");
