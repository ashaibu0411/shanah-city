import assert from "node:assert/strict";
import { enrichHomeworkActivities } from "../src/lib/marriage-homework-written-guidance";
import { PREMARITAL_HOMEWORK_WRITTEN_GUIDANCE } from "../src/lib/marriage-homework-written-guidance-premarital";
import { allPremaritalHomeworkTemplateKeys } from "../src/lib/marriage-homework-template-meta";
import { cloneTemplateActivities, WEEK_1_HOMEWORK_TEMPLATE_KEY } from "../src/lib/marriage-homework-templates";
import { homeworkAnswerKey } from "../src/lib/marriage-homework-types";

assert.equal(Object.keys(PREMARITAL_HOMEWORK_WRITTEN_GUIDANCE).length, 46, "sessions 2–8 guidance entries");

let improved = 0;
for (const templateKey of allPremaritalHomeworkTemplateKeys()) {
  const activities = enrichHomeworkActivities(cloneTemplateActivities(templateKey));
  for (const act of activities) {
    for (const q of act.questions) {
      improved += 1;
      const key = homeworkAnswerKey(act.id, q.id);
      assert.ok(q.explanation?.trim(), `${templateKey} ${key} missing explanation`);
      assert.ok((q.writingExamples?.length ?? 0) >= 3, `${templateKey} ${key} needs examples`);
      if (templateKey !== WEEK_1_HOMEWORK_TEMPLATE_KEY) {
        assert.ok(PREMARITAL_HOMEWORK_WRITTEN_GUIDANCE[key], `${key} in premarital map`);
      }
    }
  }
}

assert.equal(improved, 57, "total writable homework prompts across eight templates");

console.log(`marriage-homework-written-guidance-coverage.test.ts: OK (${improved} prompts)`);
