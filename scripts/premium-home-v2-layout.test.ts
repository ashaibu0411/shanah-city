import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const mobile = readFileSync(
  path.join(process.cwd(), "src/components/home/premium/PremiumHomeMobile.tsx"),
  "utf8",
);
assert.match(mobile, /PremiumHomeV2Chrome/);
assert.match(mobile, /premium-home-v2/);
assert.match(mobile, /PremiumHomeV4Hero/);
assert.match(mobile, /storiesPresentation="portrait"/);

const v2css = readFileSync(path.join(process.cwd(), "src/app/premium-home-v2.css"), "utf8");
assert.match(v2css, /premium-home-v2-active/);
assert.match(v2css, /--ph2-gold/);

const globals = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
assert.match(globals, /premium-home-v2\.css/);

console.log("premium-home-v2-layout.test.ts OK");
