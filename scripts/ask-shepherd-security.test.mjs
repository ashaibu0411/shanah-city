/**
 * Static checks: Ask Shepherd API routes authenticate with session.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiRoot = join(root, "src/app/api/leadership/ask-shepherd");

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
assert.ok(routes.length >= 4, "expected Ask Shepherd API routes");

for (const file of routes) {
  const src = readFileSync(file, "utf8");
  const rel = file.replace(root + "\\", "").replace(root + "/", "");
  assert.ok(
    src.includes("getUserFromSession") || src.includes("requireAskShepherdApiRequest"),
    `${rel} must authenticate`,
  );
  assert.ok(src.includes("SESSION_COOKIE") || src.includes("requireAskShepherdApiRequest"), `${rel} must use session`);
}

const server = readFileSync(join(root, "src/lib/ask-shepherd-server.ts"), "utf8");
assert.match(server, /appendAskShepherdAudit/, "server should audit");

const ai = readFileSync(join(root, "src/lib/ask-shepherd-ai-server.ts"), "utf8");
assert.ok(!ai.includes("NEXT_PUBLIC_ASK_SHEPHERD"), "do not expose client env in AI adapter");

console.log(`ask-shepherd-security.test.mjs: OK (${routes.length} routes)`);
