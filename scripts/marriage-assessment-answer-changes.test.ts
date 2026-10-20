/**
 * Counselor answer change detection (no database).
 * Run: npx tsx scripts/marriage-assessment-answer-changes.test.ts
 */
import assert from "node:assert/strict";
import { getChangedCounselorConsentQuestionIds } from "../src/lib/marriage-assessment-answer-changes";
import type { MarriageQuestionDefinition } from "../src/lib/marriage-counseling-types";

function q(id: string, visibility: MarriageQuestionDefinition["visibility"]) {
  return {
    id,
    moduleId: "m",
    prompt: id,
    type: "short_answer" as const,
    required: false,
    visibility,
  };
}

function run() {
  const questions = [
    q("shared", "shared_after_both_submit"),
    q("counselor-a", "counselor_with_consent"),
    q("counselor-b", "counselor_with_consent"),
  ];
  const prev = { "counselor-a": "one", "counselor-b": "two", shared: "x" };
  const next = { "counselor-a": "one-changed", "counselor-b": "two", shared: "y" };
  const changed = getChangedCounselorConsentQuestionIds(questions, prev, next);
  assert.deepEqual(changed, ["counselor-a"]);
  console.log("marriage-assessment-answer-changes.test.ts: OK");
}

run();
