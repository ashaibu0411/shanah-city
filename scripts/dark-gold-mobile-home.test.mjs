import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const home = readFileSync(join(root, "src/components/home/premium/PremiumHomeMobile.tsx"), "utf8");
const welcome = readFileSync(join(root, "src/components/home/premium/DarkHomeWelcome.tsx"), "utf8");
const styles = readFileSync(join(root, "src/app/premium-home.css"), "utf8");
const desktop = readFileSync(join(root, "src/components/home/premium/PremiumHomeDesktop.tsx"), "utf8");

assert.match(home, /<DarkHomeWelcome/);
assert.doesNotMatch(home, /<PremiumMobileLauncher\s*\/>/);
assert.match(desktop, /<PremiumHomeHero variant="desktop"/);
for (const href of ["/live", "/devotions", "/community", "/calendar", "/give"]) {
  assert.ok(welcome.includes(`href: "${href}"`) || welcome.includes(`href="${href}"`), href);
}
for (const color of ["#08152d", "#f4d28d", "#243858"]) {
  assert.ok(welcome.includes(color), color);
}
assert.match(welcome, /focus-visible:outline/);
assert.match(welcome, /Changing lives to higher levels in God/);
assert.match(welcome, /<svg className="absolute inset-x-0 top-28/);
assert.match(home, /premium-home--flyer/);
assert.ok(home.indexOf("<DarkHomeWelcome") < home.indexOf("<PremiumEngagementRail"), "hero must appear before reminders");
assert.match(styles, /body:has\(\.premium-home--flyer\) \.mobile-app-header/);
assert.match(styles, /body:has\(\.premium-home--flyer\) \.mobile-bottom-nav/);
console.log("dark gold mobile home design checks OK");
