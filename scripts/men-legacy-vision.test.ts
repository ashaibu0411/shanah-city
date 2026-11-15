import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildMenVisionScorecard } from "../src/lib/men-vision-scorecard";
import { VISION_2027_DRAFTS } from "../src/lib/vision-2027-drafts";
import { getReportTemplateForGroup, isReportableMinistryGroup, type MinistryLeaderReport } from "../src/lib/ministry-report-types";

const men = VISION_2027_DRAFTS.find(d => d.ministryKey === "men");
assert.ok(men);
for (const text of ["12 monthly", "six structured", "30%", "25%", "20–30%", "June 18–20, 2027", "FOUR", "QUARTERLY", "NOT APPROVED"]) {
  assert.ok(men.content.toUpperCase().includes(text.toUpperCase()), `Men's plan requires ${text}`);
}
const group = { id: "group-men-legacy", name: "Men of Legacy", category: "ministry" as const };
assert.ok(isReportableMinistryGroup(group), "Men of Legacy should submit monthly leader reports");
const template = getReportTemplateForGroup(group);
for (const key of ["prayerMeetingsHeld","prayerTotalAttendance","breakfastMeetingsHeld","breakfastTotalAttendance","sundayMenAverage","prayer2026Baseline","breakfast2026Baseline","sunday2026Baseline","quarterlyReviewCompleted"]) {
  assert.ok(template.questions.some(q => q.id === key), `Missing report field: ${key}`);
}
assert.equal(buildMenVisionScorecard([]).metrics.prayerMeetings.actual, null);
assert.equal(buildMenVisionScorecard([]).metrics.prayer.growthPct, null);

function report(month: string, status: MinistryLeaderReport["status"], responses: Record<string, number | string>) {
  return { groupId:"group-men-legacy", reportMonth: month, status, submittedAt: "2027-02-02T00:00:00.000Z", responses } as MinistryLeaderReport;
}
const scorecard = buildMenVisionScorecard([
  report("2027-01", "reviewed", {
    prayerMeetingsHeld: 1, prayerTotalAttendance: 13, breakfastMeetingsHeld: 1, breakfastTotalAttendance: 25,
    sundayMenAverage: 12, prayer2026Baseline: 10, breakfast2026Baseline: 20, sunday2026Baseline: 10,
    baselineEvidence: "2026 verified monthly attendance ledger",
    quarterlyReviewCompleted: "Yes — completed", quarterlyActions: "Men's follow-up action plan",
  }),
  report("2027-02", "draft", { prayerMeetingsHeld: 99, prayerTotalAttendance: 500 }),
  report("2027-03", "returned", { prayerMeetingsHeld: 99 }),
]);
assert.equal(scorecard.reportedMonths, 1);
assert.equal(scorecard.metrics.prayerMeetings.actual, 1);
assert.equal(scorecard.metrics.breakfasts.actual, 1);
assert.equal(scorecard.metrics.prayer.growthPct, 30);
assert.equal(scorecard.metrics.breakfast.growthPct, 25);
assert.equal(scorecard.metrics.sunday.growthPct, 20);
assert.equal(scorecard.metrics.quarterlyReviews.actual, 1);
assert.equal(scorecard.quarters[0].reviewCompleted, true);
assert.equal(scorecard.quarters[1].reviewCompleted, false);
assert.equal(scorecard.missingMonths.length, 11);
assert.equal(buildMenVisionScorecard([report("2027-01","submitted",{ prayerMeetingsHeld:1,prayerTotalAttendance:13 })]).metrics.prayer.growthPct, null);

const api = readFileSync("src/app/api/vision/men-scorecard/route.ts","utf8");
assert.match(api,/canReadVision/);
assert.match(api,/groupId: "group-men-legacy"/);
const page = readFileSync("src/components/vision/VisionCenterHub.tsx","utf8");
assert.match(page,/selected.ministryKey === "men" && <MenLegacyScorecard/);
console.log("Men of Legacy vision and scorecard regression passed.");
