import assert from "node:assert/strict";
import { MARRIAGE_COUNSELING_MODULES } from "../src/lib/marriage-counseling-curriculum";
import { applyCanonicalQuestionCorrections } from "../src/lib/marriage-curriculum-canonical";
import { MARRIAGE_COUNSELING_MODULES_V2026_1 } from "../src/lib/marriage-counseling-curriculum-v2026-1";
import { enrichHomeworkActivities } from "../src/lib/marriage-homework-written-guidance";
import { allPremaritalHomeworkTemplateKeys } from "../src/lib/marriage-homework-template-meta";
import { cloneTemplateActivities } from "../src/lib/marriage-homework-templates";
import {
  WRITTEN_QUESTION_GUIDANCE,
  countWrittenResponseQuestions,
  validateWrittenQuestionGuidanceForModules,
} from "../src/lib/marriage-written-question-guidance";

const writtenCount = countWrittenResponseQuestions(MARRIAGE_COUNSELING_MODULES);
assert.equal(writtenCount, 37, "expected 37 written-response questions in seed");
assert.equal(Object.keys(WRITTEN_QUESTION_GUIDANCE).length, 37, "guidance map must cover every written question");

const seedIssues = validateWrittenQuestionGuidanceForModules(MARRIAGE_COUNSELING_MODULES);
assert.equal(seedIssues.length, 0, seedIssues.map((i) => `${i.questionId}: ${i.message}`).join("; "));

const simulatedPublished = applyCanonicalQuestionCorrections(MARRIAGE_COUNSELING_MODULES_V2026_1);
const runtimeIssues = validateWrittenQuestionGuidanceForModules(simulatedPublished);
assert.equal(runtimeIssues.length, 0, "published override path must retain guidance");

const fb = MARRIAGE_COUNSELING_MODULES.find((m) => m.id === "mod-02-family-background")!;
const q3 = fb.questions.find((q) => q.id === "fb-parents-model")!;
assert.ok(q3.explanation?.includes("observed"), "fb-parents-model has what-we-mean guidance");
assert.ok((q3.writingExamples?.length ?? 0) >= 3, "fb-parents-model has examples");

let homeworkPromptTotal = 0;
for (const templateKey of allPremaritalHomeworkTemplateKeys()) {
  const hwActs = enrichHomeworkActivities(cloneTemplateActivities(templateKey));
  const writtenHw = hwActs.flatMap((a) => a.questions);
  homeworkPromptTotal += writtenHw.length;
  for (const q of writtenHw) {
    assert.ok(q.explanation?.trim(), `${templateKey}:${q.id} missing homework explanation`);
    assert.ok((q.writingExamples?.length ?? 0) >= 3, `${templateKey}:${q.id} missing homework examples`);
  }
}
assert.equal(homeworkPromptTotal, 57, "all eight templates enriched");

console.log(
  `marriage-written-guidance.test.ts OK (${writtenCount} curriculum + ${homeworkPromptTotal} homework)`,
);
