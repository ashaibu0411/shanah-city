import assert from "node:assert/strict";
import { questionsForKind } from "@/lib/temperament-shepherding-content";
import {
  computeClassicalScores,
  computeDimensionScores,
  totalQuestionsForKind,
} from "@/lib/temperament-shepherding-scoring";
import { validateAnswersForKind } from "@/lib/temperament-shepherding-server";
import type { TemperamentAnswersMap } from "@/lib/temperament-shepherding-types";

const memberQs = questionsForKind("member");
const leaderQs = questionsForKind("leader");
assert.equal(memberQs.length, 40, "member questionnaire should have 40 items");
assert.equal(leaderQs.length, 50, "leader questionnaire should include 10 leader-only items");

function allThrees(kind: "member" | "leader"): TemperamentAnswersMap {
  const out: TemperamentAnswersMap = {};
  for (const q of questionsForKind(kind)) {
    out[q.id] = 3;
  }
  return out;
}

const neutral = allThrees("member");
const classical = computeClassicalScores(neutral, "member");
const dims = computeDimensionScores(neutral, "member");
for (const v of Object.values(classical)) {
  assert.ok(Number.isFinite(v));
}
for (const v of Object.values(dims)) {
  assert.equal(v, 50, "all-neutral Likert should map dimensions to ~50%");
}

const strongSanguine: TemperamentAnswersMap = { ...neutral };
for (const q of memberQs) {
  const hint = q.classicalHint.sanguine ?? 0;
  strongSanguine[q.id] = hint > 0 ? 5 : 1;
}
const sClass = computeClassicalScores(strongSanguine, "member");
assert.ok(sClass.sanguine >= sClass.choleric, "sanguine-weighted pattern should lift sanguine");

const incomplete: TemperamentAnswersMap = { m01: 4 };
const bad = validateAnswersForKind(incomplete, "member");
assert.equal(bad.ok, false, "incomplete submission should fail validation");

const full = allThrees("member");
const good = validateAnswersForKind(full, "member");
assert.equal(good.ok, true);
assert.equal(good.answeredCount, totalQuestionsForKind("member"));

console.log("temperament-shepherding-scoring.test.ts OK");
