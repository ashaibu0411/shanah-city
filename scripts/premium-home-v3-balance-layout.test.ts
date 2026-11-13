import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const mobile = readFileSync(
  path.join(process.cwd(), "src/components/home/premium/PremiumHomeMobile.tsx"),
  "utf8",
);
assert.match(mobile, /premium-home-v3__balance-lower/);
assert.ok(
  mobile.indexOf("PremiumHomeV4LatestSermon") < mobile.indexOf("premium-home-v3__balance-lower"),
  "sermon must precede balance-lower footer group",
);

const balanceCss = readFileSync(
  path.join(process.cwd(), "src/app/premium-home-v3-balance.css"),
  "utf8",
);
assert.match(balanceCss, /margin-top:\s*auto/);
assert.match(balanceCss, /ph4-hero--v3/);

const globals = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
assert.match(globals, /premium-home-v3-balance\.css/);

console.log("premium-home-v3-balance-layout.test.ts OK");
