import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const server = readFileSync(
  join(root, "src/lib/marriage-counselor-command-center-server.ts"),
  "utf8",
);
assert.match(server, /viewerHasClinicalCounselorAccess/, "command center uses clinical assignment gate");
assert.match(server, /assertMarriageCounselorRole/, "command center requires counselor role");
assert.match(server, /listMarriageCounselorDashboardJourneys/, "couples limited to assigned journeys");
assert.doesNotMatch(server, /hardcoded|sampleCount|dummy/i, "no hardcoded sample counts");

const ui = readFileSync(
  join(root, "src/components/marriage/MarriageCounselorCommandCenter.tsx"),
  "utf8",
);
assert.match(ui, /No assigned couples yet/, "empty state for counselors without caseload");
assert.match(ui, /\/api\/marriage\/counselor/, "command center loads authorized counselor API");

const counselorApi = readFileSync(join(root, "src/app/api/marriage/counselor/route.ts"), "utf8");
assert.match(counselorApi, /getCounselorDashboard/, "existing counselor API entry");

console.log("marriage-counselor-command-center.test.ts: OK");
