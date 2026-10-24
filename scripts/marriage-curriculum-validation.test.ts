import assert from "node:assert/strict";
import { MARRIAGE_COUNSELING_MODULES } from "../src/lib/marriage-counseling-curriculum";
import { validateMarriageCurriculumModules } from "../src/lib/marriage-curriculum-validation";

function countQuestions() {
  let total = 0;
  for (const mod of MARRIAGE_COUNSELING_MODULES) {
    total += mod.questions.length;
  }
  return { modules: MARRIAGE_COUNSELING_MODULES.length, questions: total };
}

const counts = countQuestions();
console.log(`Curriculum: ${counts.modules} modules, ${counts.questions} questions`);

const issues = validateMarriageCurriculumModules(MARRIAGE_COUNSELING_MODULES);
if (issues.length) {
  console.error("Validation issues:");
  for (const issue of issues) {
    console.error(`  [${issue.moduleId} / ${issue.questionId}] ${issue.message}`);
  }
  process.exit(1);
}

const fb = MARRIAGE_COUNSELING_MODULES.find((m) => m.id === "mod-02-family-background");
assert.ok(fb, "Family Background module exists");
const household = fb!.questions.find((q) => q.id === "fb-household");
assert.equal(household?.type, "single_choice", "fb-household uses descriptive single_choice");
assert.ok(
  household?.options?.some((o) => o.label.includes("warm")),
  "fb-household has tone options",
);
assert.equal(
  fb!.questions.find((q) => q.id === "fb-traditions")?.explanation?.includes("traditions"),
  true,
  "fb-traditions has guidance",
);

const likertMisuse = MARRIAGE_COUNSELING_MODULES.flatMap((m) =>
  m.questions.filter((q) => q.type === "likert" && q.prompt.endsWith("?")),
);
assert.equal(likertMisuse.length, 0, "no likert questions ending with ?");

console.log("marriage-curriculum-validation.test.ts OK");
