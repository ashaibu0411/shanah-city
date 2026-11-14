import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const sermon = readFileSync(
  path.join(process.cwd(), "src/components/home/premium/v4/PremiumHomeV4LatestSermon.tsx"),
  "utf8",
);
assert.match(sermon, /ph4-sermon--stack/);

const edgeCss = readFileSync(path.join(process.cwd(), "src/app/premium-home-v3-edge.css"), "utf8");
assert.match(edgeCss, /--home-v3-gutter:\s*10px/);
assert.match(edgeCss, /ph4-sermon--stack/);
assert.match(edgeCss, /margin-top:\s*0/);
assert.match(edgeCss, /padding-left:\s*0 !important/);
assert.match(edgeCss, /ph4-event-row__body/);

const globals = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
assert.match(globals, /premium-home-v3-edge\.css/);
assert.ok(
  globals.indexOf("premium-home-v3-balance.css") < globals.indexOf("premium-home-v3-edge.css"),
  "edge layout CSS must load after balance CSS",
);

console.log("premium-home-v3-edge-layout.test.ts OK");