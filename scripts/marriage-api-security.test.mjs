/**
 * Static checks: marriage API routes require session and delegate to server modules.
 * Run: node scripts/marriage-api-security.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiRoot = join(root, "src/app/api/marriage");

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
assert.ok(routes.length >= 10, "expected marriage API routes");

for (const file of routes) {
  const src = readFileSync(file, "utf8");
  const rel = file.replace(root + "\\", "").replace(root + "/", "");
  assert.match(src, /getUserFromSession/, `${rel} must authenticate via session`);
  assert.match(src, /SESSION_COOKIE/, `${rel} must read session cookie`);
  assert.doesNotMatch(src, /answersJson.*NextResponse\.json/s, `${rel} should not expose raw answersJson`);
}

const server = readFileSync(join(root, "src/lib/marriage-counseling-server.ts"), "utf8");
assert.match(server, /partnerProgress/, "assessment API uses partnerProgress not partner answers");
assert.match(server, /assertJourneyParticipant/, "comparison uses participant check");

const comparisonUtil = readFileSync(
  join(root, "src/lib/marriage-counseling-comparison-utils.ts"),
  "utf8",
);
assert.match(
  comparisonUtil,
  /shared_after_both_submit/,
  "comparisons only include shared visibility questions",
);

console.log(`marriage-api-security.test.mjs: OK (${routes.length} routes)`);
