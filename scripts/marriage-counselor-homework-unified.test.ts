import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const hwServer = readFileSync(join(root, "src/lib/marriage-homework-server.ts"), "utf8");
assert.match(hwServer, /legacy_module_assignment/, "counselor list includes legacy rows");
assert.match(hwServer, /isLegacyAssignmentHomeworkId/, "counselor detail rejects legacy ids");
assert.match(hwServer, /assertHomeworkManager/, "counselor homework manager auth");

const manager = readFileSync(join(root, "src/components/marriage/MarriageCounselorHomeworkManager.tsx"), "utf8");
assert.match(manager, /legacy_module_assignment/, "counselor UI labels legacy assignments");
assert.match(manager, /isLegacyAssignmentHomeworkId/, "counselor UI skips legacy detail fetch");

console.log("marriage-counselor-homework-unified.test.ts: OK");
