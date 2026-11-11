import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const home = readFileSync(join(root, "src/components/home/premium/PremiumHomeMobile.tsx"), "utf8");
const welcome = readFileSync(join(root, "src/components/home/premium/DarkHomeWelcome.tsx"), "utf8");
const desktop = readFileSync(join(root, "src/components/home/premium/PremiumHomeDesktop.tsx"), "utf8");

assert.match(home, /<DarkHomeWelcome/);
assert.doesNotMatch(home, /<PremiumMobileLauncher\s*\/>/);
assert.match(desktop, /<PremiumHomeHero variant="desktop"/);
for (const href of ["/live", "/devotions", "/community", "/calendar", "/give"]) {
  assert.ok(welcome.includes(`href: "${href}"`) || welcome.includes(`href="${href}"`), href);
}
for (const color of ["#08152d", "#f4d28d", "#223550"]) {
  assert.ok(welcome.includes(color), color);
}
assert.match(welcome, /focus-visible:outline/);
assert.match(welcome, /Changing lives to higher levels in God/);
console.log("dark gold mobile home design checks OK");
