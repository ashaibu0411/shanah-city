import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { VISION_2027_DRAFTS } from "../src/lib/vision-2027-drafts";
import { makeVisionMilestoneTemplates } from "../src/lib/vision-milestones";
import { getReportTemplateForGroup, type MinistryLeaderReport } from "../src/lib/ministry-report-types";
import { buildVisionMinistryScorecard } from "../src/lib/vision-ministry-scorecards";

const plan = (key: string) => {
  const item = VISION_2027_DRAFTS.find(x => x.ministryKey === key);
  assert.ok(item, "Missing " + key + " plan");
  return item.content;
};
assert.match(plan("churchwide"), /three in-person discipleship trainings/i);
assert.match(plan("churchwide"), /Vacation Bible School/i);
assert.match(plan("operations"), /THREE IN-PERSON DREAM TEAM DISCIPLESHIP TRAININGS/);
for (const theme of ["A Disciple Before a Volunteer", "Faithful Stewards", "Disciples Who Multiply"]) {
  assert.ok(plan("operations").includes(theme));
}
const kid = plan("kids");
assert.match(kid, /JUNE VACATION BIBLE SCHOOL & KIDS SUNDAY CELEBRATION/);
assert.match(kid, /school summer break/i);
assert.match(kid, /end of that same week/i);
assert.match(kid, /exact June dates.*TO BE CONFIRMED/i);
assert.match(kid, /parent\/guardian consent/);
assert.match(kid, /No identifiable child/);
const operations = makeVisionMilestoneTemplates("operations");
assert.equal(operations.filter(t => t.kind === "dream-team-discipleship").length, 3);
assert.equal(operations.filter(t => t.kind === "dream-team-discipleship-proposal").length, 1);
assert.deepEqual(operations.filter(t => t.kind === "dream-team-discipleship").map(t => t.period), [
  "2027-dream-team-1", "2027-dream-team-2", "2027-dream-team-3",
]);
const tasks = makeVisionMilestoneTemplates("kids");
for (const kind of ["kids-vbs-proposal", "kids-vbs-readiness", "kids-vbs-june", "kids-vbs-followup"]) {
  assert.equal(tasks.filter(t => t.kind === kind).length, 1);
}
assert.equal(tasks.find(t => t.kind === "kids-vbs-june")?.dueOn, "2027-06-30");
assert.ok(tasks.find(t => t.kind === "kids-vbs-june")?.description.includes("reporting deadline"));
const questions = getReportTemplateForGroup({id:"group-kids",name:"Shanah Kids"}).questions;
for(const key of ["kidsVbsHeld","kidsSundayCelebrationHeld","kidsVbsAggregateAttendance","kidsVbsNewFamilies","kidsVbsVolunteers","kidsVbsFollowUp"]) {
  assert.ok(questions.some(x => x.id === key), "Missing report metric " + key);
}
const empty = buildVisionMinistryScorecard("kids", []);
assert.equal(empty.metrics.find(x => x.key === "vbs")?.actual, null);
assert.equal(empty.metrics.find(x => x.key === "kidsSunday")?.actual, null);
const submitted = {
  groupId: "group-kids", reportMonth: "2027-06", status: "reviewed", submittedAt: "2027-07-01T00:00:00.000Z",
  responses: { kidsVbsHeld: "Yes — completed", kidsSundayCelebrationHeld: "Yes — completed",
    kidsVbsAggregateAttendance: 80, kidsVbsNewFamilies: 6, kidsVbsVolunteers: 12 }
} as MinistryLeaderReport;
const score = buildVisionMinistryScorecard("kids", [submitted]);
assert.equal(score.metrics.find(x => x.key === "vbs")?.actual, 1);
assert.equal(score.metrics.find(x => x.key === "kidsSunday")?.actual, 1);
assert.equal(score.metrics.find(x => x.key === "vbsAttendance")?.actual, 80);
assert.equal(score.metrics.find(x => x.key === "vbsNewFamilies")?.actual, 6);
assert.equal(score.metrics.find(x => x.key === "vbsVolunteers")?.actual, 12);
const api = readFileSync("src/app/api/vision/ministry-scorecard/route.ts", "utf8");
assert.match(api, /canReadVision/);
console.log("2027 Dream Team discipleship and Shanah Kids VBS/Kids Sunday regression checks passed.");
