import assert from "node:assert/strict";
import {
  cloneTemplateActivities,
  listHomeworkTemplateSummaries,
  WEEK_1_HOMEWORK_TEMPLATE_KEY,
} from "../src/lib/marriage-homework-templates";
import {
  countAnsweredQuestions,
  homeworkIsCompleteForSubmit,
  participantHomeworkStatus,
  totalWritableQuestions,
} from "../src/lib/marriage-homework-status";
import { homeworkAnswerKey } from "../src/lib/marriage-homework-types";
import type { MarriageSessionHomeworkRecord } from "../src/lib/marriage-homework-types";

const templates = listHomeworkTemplateSummaries();
assert.ok(templates.some((t) => t.key === WEEK_1_HOMEWORK_TEMPLATE_KEY));

const activities = cloneTemplateActivities(WEEK_1_HOMEWORK_TEMPLATE_KEY);
assert.equal(activities.length, 4);
assert.equal(activities[0].kind, "individual_writing");
assert.equal(activities[0].questions.length, 5);
assert.equal(activities[3].kind, "curriculum_link");
assert.deepEqual(activities[3].moduleIds, ["mod-01-knowing-yourself"]);

const total = totalWritableQuestions(activities);
assert.equal(total, 5 + 3 + 3);

const hw: MarriageSessionHomeworkRecord = {
  id: "hw1",
  journeyId: "j1",
  counselorUserId: "c1",
  templateKey: WEEK_1_HOMEWORK_TEMPLATE_KEY,
  title: "Week 1",
  status: "released",
  activities,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  dueAt: new Date(Date.now() - 86400000).toISOString(),
};

assert.equal(participantHomeworkStatus({ homework: hw, response: null }), "overdue");

const partialAnswers = { [homeworkAnswerKey("activity-a", "a1")]: "Strength one" };
assert.equal(countAnsweredQuestions(activities, partialAnswers), 1);
assert.equal(
  participantHomeworkStatus({
    homework: hw,
    response: { homeworkId: "hw1", userId: "u1", answers: partialAnswers, lastSavedAt: "" },
  }),
  "overdue",
);

assert.equal(homeworkIsCompleteForSubmit(activities, partialAnswers), false);

console.log("marriage-session-homework.test.ts: OK");
