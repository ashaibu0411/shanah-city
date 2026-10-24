import assert from "node:assert/strict";
import { MARRIAGE_COUNSELING_MODULES } from "../src/lib/marriage-counseling-curriculum";
import { MARRIAGE_COUNSELING_MODULES_V2026_1 } from "../src/lib/marriage-counseling-curriculum-v2026-1";
import {
  ARCHIVED_ANSWERS_KEY,
  isAnswerCompatibleWithQuestion,
  migrateDraftAssessmentResponse,
} from "../src/lib/marriage-assessment-version-migration";
import {
  applyCanonicalQuestionCorrections,
  questionNeedsCanonicalCorrection,
} from "../src/lib/marriage-curriculum-canonical";
import { validateMarriageCurriculumModules } from "../src/lib/marriage-curriculum-validation";

const brokenFb = MARRIAGE_COUNSELING_MODULES_V2026_1.find((m) => m.id === "mod-02-family-background")!;
const brokenHousehold = brokenFb.questions.find((q) => q.id === "fb-household")!;
assert.equal(brokenHousehold.type, "likert");
assert.ok(questionNeedsCanonicalCorrection("mod-02-family-background", brokenHousehold));

const simulatedPublished = applyCanonicalQuestionCorrections(MARRIAGE_COUNSELING_MODULES_V2026_1);
const fixedFb = simulatedPublished.find((m) => m.id === "mod-02-family-background")!;
const fixedHousehold = fixedFb.questions.find((q) => q.id === "fb-household")!;
assert.equal(fixedHousehold?.type, "single_choice");
assert.ok(fixedHousehold?.options?.some((o) => o.label.includes("warm")));

const runtimeIssues = validateMarriageCurriculumModules(simulatedPublished);
assert.equal(runtimeIssues.length, 0, `runtime published should validate: ${runtimeIssues[0]?.message}`);

const canonicalFb = MARRIAGE_COUNSELING_MODULES.find((m) => m.id === "mod-02-family-background")!;
const canonicalHousehold = canonicalFb.questions.find((q) => q.id === "fb-household")!;
assert.equal(
  isAnswerCompatibleWithQuestion(canonicalHousehold!, "3"),
  false,
  "likert numeric must not match single_choice",
);

const migrated = migrateDraftAssessmentResponse({
  record: {
    id: "r1",
    journeyId: "j1",
    moduleId: "mod-02-family-background",
    contentVersion: "2026.1",
    userId: "u1",
    status: "draft",
    answers: { "fb-household": "3", "fb-traditions": "Holiday meals" },
    lastSavedAt: new Date().toISOString(),
  },
  priorModule: brokenFb,
  targetModule: canonicalFb,
});
assert.equal(migrated.record.contentVersion, "2026.2");
assert.equal(migrated.record.answers["fb-household"], undefined);
assert.equal(migrated.record.answers["fb-traditions"], "Holiday meals");
const archived = migrated.record.answers[ARCHIVED_ANSWERS_KEY] as Record<string, { value: unknown }>;
assert.equal(archived["fb-household"].value, "3");
assert.ok(migrated.notices.some((n) => n.questionId === "fb-household"));

console.log("marriage-assessment-migration.test.ts OK");
