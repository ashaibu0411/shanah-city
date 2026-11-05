/**
 * Phase 2B — twelve module banks, privacy, budget math, intimacy gate.
 */
import assert from "node:assert/strict";
import { allPhase2BModuleDefinitions } from "../src/lib/marriage-stage2-content";
import { validateBudgetAnswer } from "../src/lib/marriage-budget-utils";
import { buildComparisonItemsWithConsent } from "../src/lib/marriage-stage2-activity-engine";
import {
  isMarriageStage2IntimacyApproved,
  marriageStage2IntimacyModuleAccessible,
} from "../src/lib/marriage-stage2-feature";
import { buildTemperamentInsights } from "../src/lib/marriage-stage2-temperament-insights";
import { freezeStage2ModulesIntoSnapshot } from "../src/lib/marriage-curriculum-stage2-merge";
import { computeModuleSubmissionProgress } from "../src/lib/marriage-module-progress";

const MIN_QUESTIONS_CORE = 55;
const CORE_PHASE2B_IDS = new Set([
  "s2-temperament-discovery",
  "s2-mod-02-family-background",
  "s2-mod-03-communication",
  "s2-mod-04-conflict-lab",
  "s2-financial-workshop",
  "s2-mod-06-intimacy",
]);

function run() {
  const modules = allPhase2BModuleDefinitions();
  assert.equal(modules.length, 12, "twelve Stage 2 learning modules");

  for (const mod of modules) {
    assert.ok(mod.lessons?.length, `${mod.id} has lessons`);
    const isCore = CORE_PHASE2B_IDS.has(mod.id);
    if (isCore) {
      assert.ok(mod.questions.length >= MIN_QUESTIONS_CORE, `${mod.id} question count ${mod.questions.length}`);
    } else {
      assert.ok(mod.lessons.length >= 3, `${mod.id} growth lessons`);
      assert.ok(mod.questions.length >= 6, `${mod.id} growth questions ${mod.questions.length}`);
    }
    const privateQs = mod.questions.filter(
      (q) =>
        q.visibility === "private_reflection" ||
        q.visibility === "private_financial_disclosure" ||
        q.visibility === "counselor_with_consent",
    );
    const shared = mod.questions.filter((q) => q.visibility === "shared_after_both_submit");
    if (isCore) {
      assert.ok(privateQs.length >= 3, `${mod.id} private items`);
      assert.ok(shared.length >= 10, `${mod.id} shared items`);
    } else {
      assert.ok(privateQs.length >= 1, `${mod.id} private reflection`);
      assert.ok(shared.length >= 2, `${mod.id} shared agreement items`);
    }
  }

  const fin = modules.find((m) => m.id === "s2-financial-workshop")!;
  const budgetQ = fin.questions.find((q) => q.type === "budget_worksheet");
  assert.ok(budgetQ, "budget worksheet question");
  const bad = validateBudgetAnswer({
    mode: "hypothetical",
    monthlyIncome: 1000,
    lines: [{ id: "a", label: "Rent", amount: 1500 }],
  });
  assert.equal(bad.ok, false, "budget rejects over-allocation");
  const good = validateBudgetAnswer({
    mode: "hypothetical",
    monthlyIncome: 5000,
    lines: [
      { id: "a", label: "Rent", amount: 1500 },
      { id: "b", label: "Food", amount: 600 },
    ],
  });
  assert.equal(good.ok, true, "budget accepts valid totals");

  const intimacy = modules.find((m) => m.id === "s2-mod-06-intimacy")!;
  const intimatePrivate = intimacy.questions.filter((q) => q.visibility === "private_reflection");
  assert.ok(intimatePrivate.length >= 30, "intimacy reflective items stay private by default");
  assert.equal(marriageStage2IntimacyModuleAccessible("s2-mod-06-intimacy"), isMarriageStage2IntimacyApproved());
  const intimacyCompare = buildComparisonItemsWithConsent(
    intimacy.questions,
    { "m06-emo-1": "5" },
    { "m06-emo-1": "2" },
    "u1",
    "u2",
    "j1",
    intimacy.id,
    [],
  );
  assert.ok(!intimacyCompare.some((c) => c.questionId.startsWith("m06-emo")), "private intimacy answers excluded from compare");

  const temp = modules.find((m) => m.id === "s2-temperament-discovery")!;
  const insights = buildTemperamentInsights(
    temp.questions,
    { "m01-soc-1": "5", "m01-soc-2": "4" },
    { "m01-soc-1": "2", "m01-soc-2": "2" },
  );
  assert.ok(insights.length >= 5, "temperament dimension insights");

  const compare = buildComparisonItemsWithConsent(
    temp.questions.filter((q) => q.visibility === "shared_after_both_submit").slice(0, 5),
    { "m01-soc-1": "4" },
    { "m01-soc-1": "2" },
    "u1",
    "u2",
    "j1",
    temp.id,
    [],
  );
  assert.ok(compare.some((c) => c.questionId === "m01-soc-1"), "comparison includes shared likert");
  assert.ok(
    !compare.some((c) => c.questionId.startsWith("m01-private")),
    "no private in comparison",
  );

  const partial = computeModuleSubmissionProgress(temp, {});
  assert.ok(partial.requiredTotal > 0 && !partial.canSubmit, "submit gated on required only");

  process.env.MARRIAGE_HUB_STAGE2_ENABLED = "1";
  const frozen = freezeStage2ModulesIntoSnapshot([]);
  assert.ok(frozen.some((m) => m.id === "s2-temperament-discovery"), "publish freeze includes stage2");
  assert.ok(
    frozen.find((m) => m.id === "s2-temperament-discovery")!.questions.length >= MIN_QUESTIONS_CORE,
    "frozen snapshot has full question bank",
  );

  console.log("marriage-stage2-phase2b.ts: OK");
}

run();
