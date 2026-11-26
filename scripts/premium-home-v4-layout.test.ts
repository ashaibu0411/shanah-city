import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const mobile = readFileSync(
  path.join(process.cwd(), "src/components/home/premium/PremiumHomeMobile.tsx"),
  "utf8",
);
assert.match(mobile, /PremiumHomeV4Hero/);
assert.match(mobile, /PremiumHomeV4GiveBar/);
assert.match(mobile, /PremiumHomeV4Chrome/);
assert.match(mobile, /PremiumHomeV4Link/);
assert.match(
  readFileSync(
    path.join(process.cwd(), "src/components/home/premium/v4/PremiumHomeV4Link.tsx"),
    "utf8",
  ),
  /appLinkPrefetchEnabled/,
);
assert.match(mobile, /premium-home-v4/);
assert.doesNotMatch(mobile, /PremiumHomeV3Chrome/);
assert.doesNotMatch(mobile, /PremiumMobileLauncher/);

const bodyStart = mobile.indexOf("premium-home-v4 shanah-porcelain-home");
assert.ok(bodyStart >= 0, "premium home v4 mobile shell missing");
const body = mobile.slice(bodyStart);
const greetingIdx = body.indexOf("PremiumHomeV4Greeting");
const storiesIdx = body.indexOf("PremiumStoriesSection");
const heroIdx = body.indexOf("PremiumHomeV4Hero");
const tilesIdx = body.indexOf("PremiumHomeV4QuickTiles");
const devotionIdx = body.indexOf("PremiumHomeV4DailyDevotion");
const giveIdx = body.indexOf("PremiumHomeV4GiveBar");
const eventsIdx = body.indexOf("PremiumHomeV4UpcomingEvents");
const sermonIdx = body.indexOf("PremiumHomeV4LatestSermon");
const checkInIdx = body.indexOf("CheckInHomeBanner");
assert.ok(
  greetingIdx >= 0 &&
    greetingIdx < storiesIdx &&
    storiesIdx < heroIdx &&
    heroIdx < devotionIdx &&
    devotionIdx < tilesIdx &&
    tilesIdx < giveIdx &&
    giveIdx < eventsIdx &&
    eventsIdx < sermonIdx &&
    sermonIdx < checkInIdx,
  "mobile home must follow stories → hero → tiles → devotion → give → events → sermon → check-in",
);
assert.doesNotMatch(mobile, /PremiumHomeV4Community/);

const desktop = readFileSync(
  path.join(process.cwd(), "src/components/home/premium/PremiumHomeDesktop.tsx"),
  "utf8",
);
assert.match(desktop, /premium-home--desktop-v4/);
assert.match(desktop, /PremiumHomeV4Hero/);
assert.match(desktop, /PremiumHomeV4QuickTiles/);
assert.match(desktop, /PremiumHomeV4DailyDevotion/);
assert.doesNotMatch(desktop, /PremiumHomeHero/);

const css = readFileSync(path.join(process.cwd(), "src/app/premium-home-v4.css"), "utf8");
assert.match(css, /premium-home-v4-active/);
assert.match(css, /ph4-hero__glow--navy/);
assert.doesNotMatch(css, /ph4-hero__glow--violet/);
assert.doesNotMatch(css, /#512d83/i);
assert.match(css, /premium-home-v4-desktop-active/);
assert.match(css, /\.ph4-section\s*\{[^}]*width:\s*auto;/s, "V4 sections must shrink inside the parent side margins");

const church = readFileSync(
  path.join(process.cwd(), "src/components/church-site/ChurchSiteHome.tsx"),
  "utf8",
);
assert.match(church, /church-premium-hero/);
assert.match(church, /Changing Lives to Higher Levels in God/);
assert.match(church, /href="\/live"/);
assert.match(
  readFileSync(path.join(process.cwd(), "src/components/church-site/ChurchSiteFrame.tsx"), "utf8"),
  /href="\/sign-in"/,
);
assert.doesNotMatch(church, /#0074aa/);
assert.doesNotMatch(church, /8B4DD8/i);

const header = readFileSync(
  path.join(process.cwd(), "src/components/app/MobileAppHeader.tsx"),
  "utf8",
);
assert.match(
  header,
  /BrandLogo size="sm" variant=\{isDark \? "dark" : "light"\}/,
  "mobile header logo must follow the current light/dark theme",
);

const tiles = readFileSync(
  path.join(process.cwd(), "src/lib/home-premium-v4.ts"),
  "utf8",
);
assert.match(tiles, /label: "Watch"/);
assert.match(tiles, /premium-v4-mountain-hero/);
assert.match(tiles, /premium-v4-devotions-bible/);

console.log("premium-home-v4-layout.test.ts OK");