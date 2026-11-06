/**
 * Static checks: temperament-shepherding API routes authenticate and avoid leaking raw answers.
 * Run: node scripts/temperament-shepherding-security.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiRoot = join(root, "src/app/api/temperament-shepherding");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name === "route.ts") out.push(p);
  }
  return out;
}

const routes = walk(apiRoot);
assert.ok(routes.length >= 4, "expected temperament-shepherding API routes");

for (const file of routes) {
  const src = readFileSync(file, "utf8");
  const rel = file.replace(root + "\\", "").replace(root + "/", "");
  assert.ok(
    src.includes("getUserFromSession") || src.includes("requireTemperamentShepherdingRequest"),
    `${rel} must authenticate via session`,
  );
  assert.ok(
    src.includes("SESSION_COOKIE") || src.includes("requireTemperamentShepherdingRequest"),
    `${rel} must read session cookie (directly or via requireTemperamentShepherdingRequest)`,
  );
  assert.doesNotMatch(
    src,
    /answersJson[^\n]*NextResponse\.json/s,
    `${rel} should not expose answersJson in JSON responses`,
  );
}

console.log(`temperament-shepherding-security.test.mjs: OK (${routes.length} routes)`);
