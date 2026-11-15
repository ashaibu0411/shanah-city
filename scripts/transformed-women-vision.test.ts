import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { VISION_2027_DRAFTS } from "../src/lib/vision-2027-drafts";
import { makeVisionMilestoneTemplates } from "../src/lib/vision-milestones";
import { getReportTemplateForGroup, isReportableMinistryGroup, type MinistryLeaderReport } from "../src/lib/ministry-report-types";
import { buildTransformedWomenScorecard } from "../src/lib/transformed-women-scorecard";

const plan = VISION_2027_DRAFTS.find(row => row.ministryKey === "women");
assert.ok(plan);
assert.equal(plan.title, "2027 Transformed Women Ministry Vision & Leadership Plan");
for (const phrase of ["six", "Bible & Brunch", "May 7–9, 2027", "Mother's Day", "community", "Expansion", "12"]) {
  assert.ok(plan.content.toLowerCase().includes(phrase.toLowerCase()), `Women's vision must include ${phrase}`);
}
const group = { id: "group-shanah-ladies", name: "Shanah Ladies", category: "ministry" as const };
assert.ok(isReportableMinistryGroup(group));
const reportTemplate = getReportTemplateForGroup(group);
assert.equal(reportTemplate.key, "ladies");
for (const key of ["bibleBrunchHeld","bibleBrunchAttendance","bibleBrunchFirstTimeCommunity","newWomenConnected","communityInvitations","communityFollowUps","quarterlyReviewCompleted"]) {
  assert.ok(reportTemplate.questions.some(q => q.id === key), `Missing women's monthly reporting field: ${key}`);
}
const tasks = makeVisionMilestoneTemplates("women");
assert.equal(tasks.filter(t => t.kind === "women-bible-brunch").length, 6);
assert.ok(tasks.filter(t => t.kind === "women-bible-brunch").every(t => Number(t.period.slice(-2)) % 2 === 0));
assert.equal(tasks.filter(t => t.kind === "women-monthly").length, 12);
assert.equal(tasks.filter(t => t.kind === "women-community-expansion").length, 12);
assert.equal(tasks.filter(t => t.kind === "women-sunday").length, 12);
assert.equal(tasks.filter(t => t.kind === "quarterly-review").length, 4);
assert.equal(tasks.find(t => t.kind === "women-mothers-day-conference")?.dueOn, "2027-05-07");
assert.equal(tasks.find(t => t.kind === "women-conference-proposal")?.dueOn, "2027-02-28");

function report(month: string, status: MinistryLeaderReport["status"], responses: Record<string, string | number>): MinistryLeaderReport {
  return { groupId: "group-shanah-ladies", reportMonth: month, status, submittedAt: "2027-02-04T00:00:00.000Z", responses } as MinistryLeaderReport;
}
const empty = buildTransformedWomenScorecard([]);
assert.equal(empty.metrics.bibleBrunch.actual, null);
assert.equal(empty.metrics.newWomenConnected.actual, null);
assert.equal(empty.sundayGrowthPercent, null);
const result = buildTransformedWomenScorecard([
  report("2027-01", "reviewed", { bibleBrunchHeld: 1, bibleBrunchFirstTimeCommunity: 2, newWomenConnected: 2, communityInvitations: 8, communityFollowUps: 2, monthlyTouchpointsHeld: 1, membersEngaged: 13, womensSundayAverage: 12, womensSunday2026Baseline: 10, baselineEvidence: "verified 2026 Sunday attendance ledger", quarterlyReviewCompleted: "Yes — completed", quarterlyActions: "Follow-up" }),
  report("2027-02", "submitted", { bibleBrunchHeld: 0, newWomenConnected: 1, membersEngaged: 16 }),
  report("2027-03", "draft", { bibleBrunchHeld: 100, newWomenConnected: 100 }),
]);
assert.equal(result.reportedMonths, 2);
assert.equal(result.metrics.bibleBrunch.actual, 1);
assert.equal(result.metrics.newWomenConnected.actual, 3);
assert.equal(result.metrics.firstTimeBrunchGuests.actual, 2);
assert.equal(result.sundayGrowthPercent, 20);
assert.equal(result.metrics.quarterlyReviews.actual, 1);
assert.equal(result.engagement.communityFollowUps, 2);
const api = readFileSync("src/app/api/vision/transformed-women-scorecard/route.ts", "utf8");
assert.match(api, /canReadVision/);
const ui = readFileSync("src/components/vision/VisionCenterHub.tsx", "utf8");
assert.match(ui, /selected.ministryKey === "women" && <TransformedWomenScorecard/);
const cron = readFileSync("src/lib/vision-reminder-cron.ts", "utf8");
assert.match(cron, /mothers-day-conference-/);
console.log("Transformed Women plan, reporting, outreach and scorecard assertions passed.");
