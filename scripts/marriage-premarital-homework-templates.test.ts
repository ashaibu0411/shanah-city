import assert from "node:assert/strict";
import {
  MARRIAGE_HOMEWORK_TEMPLATES,
  cloneTemplateActivities,
  listHomeworkTemplateSummaries,
  WEEK_1_HOMEWORK_TEMPLATE_KEY,
} from "../src/lib/marriage-homework-templates";
import {
  PREMARITAL_HOMEWORK_TEMPLATE_META,
  allPremaritalHomeworkTemplateKeys,
} from "../src/lib/marriage-homework-template-meta";
import { PREMARITAL_PROGRAM_SESSIONS } from "../src/lib/marriage-premarital-eight-session-program";
import { totalWritableQuestions } from "../src/lib/marriage-homework-status";

assert.equal(allPremaritalHomeworkTemplateKeys().length, 8);
assert.equal(Object.keys(MARRIAGE_HOMEWORK_TEMPLATES).length, 8);

for (const key of allPremaritalHomeworkTemplateKeys()) {
  assert.ok(MARRIAGE_HOMEWORK_TEMPLATES[key], `template defined: ${key}`);
  assert.ok(PREMARITAL_HOMEWORK_TEMPLATE_META[key], `meta defined: ${key}`);
  const activities = cloneTemplateActivities(key);
  assert.ok(activities.length >= 3, `${key} has activities`);
  const hasIndividual = activities.some((a) => a.kind === "individual_writing" && a.questions.length > 0);
  const hasJoint = activities.some((a) => a.kind === "joint_discussion");
  const hasScripture = activities.some((a) => a.kind === "scripture_reflection");
  assert.ok(hasIndividual, `${key} individual reflection`);
  assert.ok(hasJoint, `${key} couple exercise`);
  assert.ok(hasScripture, `${key} scripture`);
  const writable = totalWritableQuestions(activities);
  assert.ok(writable >= 5, `${key} meaningful question count`);
  for (const act of activities) {
    for (const q of act.questions) {
      assert.equal(q.visibility, "private", `${key} ${act.id}:${q.id} stays private`);
    }
  }
}

for (const session of PREMARITAL_PROGRAM_SESSIONS) {
  assert.equal(session.homeworkTemplateKeys.length, 1, `${session.sessionKey} homework mapping`);
  const templateKey = session.homeworkTemplateKeys[0]!;
  assert.ok(MARRIAGE_HOMEWORK_TEMPLATES[templateKey], `${session.sessionKey} template exists`);
  const meta = PREMARITAL_HOMEWORK_TEMPLATE_META[templateKey];
  assert.equal(meta.assignedAfterSessionOrder, session.order, `${session.sessionKey} after-session timing`);
}

const summaries = listHomeworkTemplateSummaries();
assert.ok(summaries.every((s) => s.timingLabel && s.estimatedMinutes && s.assignedAfterLabel));
const s8 = summaries.find((s) => s.key === "premarital-after-s8-sendoff");
assert.ok(s8?.postProgramNote?.includes("not preparation"), "session 8 sendoff explained");
assert.equal(s8?.preparingForLabel, null, "session 8 has no preparing-for session");
assert.ok(summaries.some((s) => s.key === WEEK_1_HOMEWORK_TEMPLATE_KEY));
assert.match(
  MARRIAGE_HOMEWORK_TEMPLATES[WEEK_1_HOMEWORK_TEMPLATE_KEY].title,
  /After Session 1/i,
  "week-1 title clarifies session timing",
);

console.log("marriage-premarital-homework-templates.test.ts: OK");
