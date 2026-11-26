import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { VISION_2027_DRAFTS } from "../src/lib/vision-2027-drafts";
import { VISION_MINISTRIES } from "../src/lib/vision-center-access-server";
import { normalizeVisionReferenceUrl } from "../src/lib/vision-center-reference-url";

assert.equal(
  VISION_2027_DRAFTS.length,
  11,
  "eleven private 2027 ministry drafts (incl. Power Couples, Shanah Kids, Operations)",
);
assert.equal(VISION_MINISTRIES.length, 11);
const draftKeys = [...new Set(VISION_2027_DRAFTS.map((d) => d.ministryKey))].sort();
const ministryKeys = [...VISION_MINISTRIES.map((m) => m.key)].sort();
assert.deepEqual(
  draftKeys,
  ministryKeys,
  "VISION_2027_DRAFTS and VISION_MINISTRIES must list the same ministry keys",
);
for (const draft of VISION_2027_DRAFTS) {
  assert.match(draft.content, /NOT APPROVED|not approved|proposed|Proposed/i, `${draft.ministryKey} must stay draft-only`);
}

const route = readFileSync(join(process.cwd(), "src/app/api/vision/plans/route.ts"), "utf8");
assert.match(route, /canReadVision/);
assert.match(route, /if \(!isOwner\) return deny/);
assert.match(route, /action === "submit" && !assignment\.acknowledgedAt/);
assert.match(route, /visionAuditEvent\.create/);
assert.doesNotMatch(route, /ChurchEvent/);
assert.doesNotMatch(route, /createEvent/);

const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
assert.match(schema, /Private 2027 Vision Center/);
assert.match(schema, /model VisionAuditEvent/);

const notify = readFileSync(join(process.cwd(), "src/lib/vision-center-notify-server.ts"), "utf8");
assert.doesNotMatch(notify, /VISION_2027|proposal|Pastoral direction/i);
assert.match(notify, /private 2027 ministry vision/i);

const hub = readFileSync(join(process.cwd(), "src/components/vision/VisionCenterHub.tsx"), "utf8");
assert.match(hub, /md:grid-cols-2 xl:grid-cols-3/, "responsive ministry cards");
assert.match(hub, /max-w-\[1440px\]/, "full-width reading canvas");
assert.match(hub, /VisionDocument/, "formatted vision reading view");
assert.match(hub, /ApprovalHistoryPanel|Approval & review history/);
assert.match(hub, /noopener noreferrer/);

assert.deepEqual(normalizeVisionReferenceUrl(""), { url: null });
assert.deepEqual(normalizeVisionReferenceUrl("https://www.canva.com/design/example"), {
  url: "https://www.canva.com/design/example",
});
const badHttp = normalizeVisionReferenceUrl("http://example.com");
assert.ok(badHttp.error);
assert.equal(badHttp.url, null);
const badJs = normalizeVisionReferenceUrl("javascript:alert(1)");
assert.ok(badJs.error);
assert.equal(badJs.url, null);
const badCreds = normalizeVisionReferenceUrl("https://user:pass@evil.test/x");
assert.ok(badCreds.error);
assert.equal(badCreds.url, null);

const migration = readFileSync(
  join(process.cwd(), "prisma/migrations/20261114140000_vision_center_phase1/migration.sql"),
  "utf8",
);
assert.doesNotMatch(migration, /ChurchEvent/);
assert.match(migration, /VisionPlan/);
assert.match(migration, /VisionAuditEvent/);

console.log("vision-center-phase1.test.ts OK");