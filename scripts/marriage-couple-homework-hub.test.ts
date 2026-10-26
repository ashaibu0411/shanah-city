import assert from "node:assert/strict";
import {
  isLegacyAssignmentHomeworkId,
  legacyAssignmentHomeworkId,
  mergeCoupleHomeworkHubViews,
} from "../src/lib/marriage-couple-homework-hub";

const session = [
  {
    id: "hw-1",
    title: "Session 1 homework",
    status: "not_started" as const,
    submitted: false,
    hasCounselorFeedback: false,
    activityCount: 2,
    templateKey: "premarital-session-1",
    timingLabel: "After session 1",
  },
];

const legacy = [
  {
    id: "asg-old",
    title: "Legacy module assignment",
    dueAt: "2026-12-01T18:00:00.000Z",
    completed: false,
    moduleId: "mod-03-communication",
  },
];

const merged = mergeCoupleHomeworkHubViews(session, legacy);
assert.equal(merged.length, 2);
const legacyRow = merged.find((h) => isLegacyAssignmentHomeworkId(h.id));
assert.ok(legacyRow);
assert.equal(legacyRow!.id, legacyAssignmentHomeworkId("asg-old"));
assert.equal(legacyRow!.templateKey, "legacy-module:mod-03-communication");

const deduped = mergeCoupleHomeworkHubViews(
  [{ ...session[0]!, templateKey: "mod-03-communication" }],
  legacy,
);
assert.equal(deduped.length, 1, "skip legacy row when session homework already covers module");

console.log("marriage-couple-homework-hub.test.ts: OK");
