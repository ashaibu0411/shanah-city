import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { VISION_2027_DRAFTS } from "../src/lib/vision-2027-drafts";
import { VISION_MINISTRIES } from "../src/lib/vision-center-access-server";
import { makeVisionMilestoneTemplates } from "../src/lib/vision-milestones";
import { buildVisionMinistryScorecard, VISION_SCORE_CONFIG } from "../src/lib/vision-ministry-scorecards";
import { getReportTemplateForGroup, type MinistryLeaderReport } from "../src/lib/ministry-report-types";

const keys = ["worship", "young-adults", "kids"] as const;
for (const key of keys) {
  const template = VISION_2027_DRAFTS.find(plan => plan.ministryKey === key);
  assert.ok(template, `Missing annual vision: ${key}`);
  assert.ok(template.content.includes("ANNUAL MINISTRY VISION & LEADERSHIP PLAN"));
  assert.ok(template.content.includes("QUARTERLY"));
  assert.ok(template.content.includes("SCORECARD"));
  assert.ok(VISION_MINISTRIES.some(ministry => ministry.key === key));
  const tasks = makeVisionMilestoneTemplates(key);
  assert.equal(tasks.filter(t => t.kind === "monthly-direction").length, 12);
  assert.equal(tasks.filter(t => t.kind === "quarterly-review").length, 4);
  assert.ok(tasks.every(t => /^2027-\d\d-\d\d$/.test(t.dueOn)));
  const scorecard = buildVisionMinistryScorecard(key, []);
  assert.equal(scorecard.reportedMonths, 0);
  assert.ok(scorecard.metrics.every(m => m.actual === null), "Missing reports must not display as achieved.");
}
assert.equal(makeVisionMilestoneTemplates("worship").filter(t => t.kind === "worship-at-the-well").length, 4);
assert.equal(makeVisionMilestoneTemplates("young-adults").filter(t => t.kind === "young-quarterly-connection").length, 4);
assert.equal(makeVisionMilestoneTemplates("young-adults").filter(t => t.kind === "young-remnant-proposal").length, 1);
assert.equal(makeVisionMilestoneTemplates("kids").filter(t => t.kind === "kids-monthly").length, 12);

const cfg = [
  ["worship", "group-choir", "choir", "worshipAtWellHeld"],
  ["young-adults", "group-young-adults", "youngAdults", "youngMonthlyTouchpoints"],
  ["kids", "group-kids", "kids", "kidsMonthlyCheckpoint"],
] as const;
for (const [ministry, id, reportKey, field] of cfg) {
  assert.equal(VISION_SCORE_CONFIG[ministry].groupId, id);
  const template = getReportTemplateForGroup({ id, name: id });
  assert.equal(template.key, reportKey);
  assert.ok(template.questions.some(q => q.id === field));
}
const report = (groupId: string, month: string, status: MinistryLeaderReport["status"], responses: Record<string, string | number>) =>
  ({ groupId, reportMonth: month, status, submittedAt: "2027-03-06T00:00:00.000Z", responses }) as MinistryLeaderReport;

const worship = buildVisionMinistryScorecard("worship", [
  report("group-choir", "2027-01", "reviewed", { worshipAtWellHeld: 1, servicesLed: 4, worshipQuarterlyReviewed: "Yes — completed", worshipQuarterlyActions: "Improve sound check" }),
  report("group-choir", "2027-02", "draft", { worshipAtWellHeld: 99 }),
]);
assert.equal(worship.metrics.find(m => m.key === "worshipAtWell")?.actual, 1);
assert.equal(worship.metrics.find(m => m.key === "quarterlyReviews")?.actual, 1);
const kids = buildVisionMinistryScorecard("kids", [
  report("group-kids", "2027-01", "submitted", { kidsMonthlyCheckpoint: "Yes — completed", childrenServed: 8, kidsServicesCovered: 4 }),
  report("group-kids", "2027-02", "submitted", { kidsMonthlyCheckpoint: "No — not completed", childrenServed: 10, kidsServicesCovered: 4 }),
]);
assert.equal(kids.metrics.find(m => m.key === "monthly")?.actual, 1);
assert.equal(kids.metrics.find(m => m.key === "children")?.actual, 9);
assert.equal(kids.metrics.find(m => m.key === "services")?.actual, 8);

const endpoint = readFileSync("src/app/api/vision/ministry-scorecard/route.ts", "utf8");
assert.match(endpoint, /canReadVision/);
assert.match(endpoint, /groupId: VISION_SCORE_CONFIG\[ministry\]\.groupId/);
const ui = readFileSync("src/components/vision/VisionCenterHub.tsx", "utf8");
assert.match(ui, /MinistryGrowthScorecard/);
const kidDocument = VISION_2027_DRAFTS.find(d => d.ministryKey === "kids")!.content;
assert.match(kidDocument, /Never place child-identifying information/);
const roster = readFileSync("src/app/api/vision/milestones/route.ts", "utf8");
assert.match(roster, /kids: "group-kids"/);
console.log("2027 Young Adults, Shanah Worship and Shanah Kids vision checks passed.");
