import assert from "node:assert/strict";
import { MARRIAGE_COUNSELING_MODULES } from "../src/lib/marriage-counseling-curriculum";
import { DEFAULT_PROGRAM_TRACKS } from "../src/lib/marriage-counseling-program-tracks";
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

const premaritalTrack = DEFAULT_PROGRAM_TRACKS.premarital;
assert.equal(premaritalTrack.length, 16, "premarital program track lists 16 modules (not full 20-module seed)");
const premaritalQuestionIds = new Set<string>();
for (const entry of premaritalTrack) {
  const mod = MARRIAGE_COUNSELING_MODULES.find((m) => m.id === entry.moduleId);
  assert.ok(mod, `premarital track module ${entry.moduleId} exists in seed curriculum`);
  for (const q of mod!.questions) premaritalQuestionIds.add(q.id);
}
console.log(`Premarital track: ${premaritalTrack.length} modules, ${premaritalQuestionIds.size} distinct questions`);

console.log("marriage-curriculum-validation.test.ts OK");
