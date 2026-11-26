import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const script = readFileSync(
  path.join(process.cwd(), "scripts/vercel-ignored-build-step.sh"),
  "utf8",
);
assert.match(script, /feature\/premium-homepage-v4/);
assert.match(script, /main\|staging/);
assert.match(script, /VERCEL_ENV.*production/);
assert.match(script, /exit 1/, "build branches must exit 1");
assert.match(script, /exit 0/, "skipped branches must exit 0");

const vercel = readFileSync(path.join(process.cwd(), "vercel.json"), "utf8");
assert.match(vercel, /vercel-ignored-build-step\.sh/);

console.log("vercel-ignored-build-step.test.mjs OK");