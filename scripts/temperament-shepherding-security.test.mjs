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

// Do not spread Prisma responses into API JSON: submitted records must not
// expose answersJson, the full snapshot, or private leader reflections.
const selfRoute = readFileSync(join(apiRoot, "[departmentKey]", "me", "route.ts"), "utf8");
const consentRoute = readFileSync(join(apiRoot, "[departmentKey]", "me", "consent", "route.ts"), "utf8");
const server = readFileSync(join(root, "src/lib/temperament-shepherding-server.ts"), "utf8");
const client = readFileSync(join(root, "src/components/worship/WorshipShepherdingHubClient.tsx"), "utf8");
const page = readFileSync(join(root, "src/app/worship/shepherding/page.tsx"), "utf8");

assert.match(selfRoute, /serializeTemperamentSelfView\(member, "member"\)/);
assert.match(selfRoute, /serializeTemperamentSelfView\(leader, "leader"\)/);
assert.match(selfRoute, /serializeTemperamentSelfView\(view, kind\)/);
assert.match(consentRoute, /serializeTemperamentSelfView\(view, "member"\)/);
assert.match(server, /export function serializeTemperamentSelfView/);
assert.match(server, /row\?\.status === "draft"/);
assert.doesNotMatch(selfRoute, /\.\.\.member,|\.\.\.leader,|\.\.\.view,/);
assert.match(server, /assessmentKind: "member",\s*status: "submitted"/);
assert.match(server, /leadershipReflectionInsights: \[\]/);
assert.match(server, /r\.leaderShareConsentAt/);
assert.match(client, /checked=\{agreed\}/, "participant must explicitly opt in");
assert.match(client, /disabled=\{busy \|\| !agreed\}/, "submit must require consent");
assert.match(page, /getTemperamentShepherdingHubNav/, "pastoral access must be supported");
assert.doesNotMatch(page, /canAccessWorshipPlanner/, "do not require pastor to join worship group");

// Mobile UI regression: keep all hub sections inside the viewport and never expose internal flags.
assert.match(client, /overflow-x-hidden/, "temperament hub must contain horizontal overflow");
assert.match(client, /max-w-full overflow-auto whitespace-pre-wrap break-all/, "shared profile text must wrap");
assert.match(client, /sm:grid-cols-\\[minmax\\(0,1fr\\)_auto\\]/, "invitation rows must adapt to narrow screens");
assert.doesNotMatch(client, /TEMPERAMENT_SHEPHERDING_SEND_INVITE_PUSH=1/, "do not display internal environment flags in the invitation UI");

console.log(`temperament-shepherding-security.test.mjs: OK (${routes.length} routes)`);
