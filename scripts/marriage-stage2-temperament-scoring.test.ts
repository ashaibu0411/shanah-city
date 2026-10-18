/**
 * Temperament scoring v2.0.0 — config integrity, formulas, privacy-safe output.
 */
import assert from "node:assert/strict";
import { buildMod01TemperamentModule } from "../src/lib/marriage-stage2-content/mod-01-temperament";
import { freezeStage2ModulesIntoSnapshot } from "../src/lib/marriage-curriculum-stage2-merge";
import { buildTemperamentInsights } from "../src/lib/marriage-stage2-temperament-insights";
import {
  TEMPERAMENT_SCORING_V1,
  TEMPERAMENT_SCORING_V2,
  assertTemperamentV2ConfigIntegrity,
  resolveTemperamentScoringModel,
} from "../src/lib/marriage-stage2-temperament-scoring-config";
import {
  agreementBandFromMean,
  buildTemperamentSnapshotV2,
  filterTemperamentScoringAnswers,
  parseLikertRaw,
} from "../src/lib/marriage-stage2-temperament-scoring-v2";

function likertIdsFromMod() {
  const mod = buildMod01TemperamentModule();
  return mod.questions.filter((q) => q.type === "likert" && q.temperamentDimension).map((q) => q.id);
}

function run() {
  process.env.MARRIAGE_HUB_STAGE2_ENABLED = "1";

  const likertIds = likertIdsFromMod();
  const integrity = assertTemperamentV2ConfigIntegrity(likertIds);
  assert.equal(integrity.likertCount, 64, "mod-01 likert count");
  assert.equal(integrity.subscaleCount, 7, "seven subscales");
  assert.equal(integrity.individualCount, 25, "individual preference rows");
  assert.equal(integrity.excludedCount, 10, "excluded items");
  assert.ok(likertIds.includes("m01-aff-8"), "m01-aff-8 exists in curriculum");

  assert.equal(resolveTemperamentScoringModel(null), TEMPERAMENT_SCORING_V2);
  assert.equal(resolveTemperamentScoringModel("1.0.0"), TEMPERAMENT_SCORING_V1);

  assert.equal(parseLikertRaw("__skip__"), null);
  assert.equal(parseLikertRaw("4"), 4);
  assert.equal(parseLikertRaw({ choice: "3" }), 3);

  for (const v of [1, 2, 3, 4, 5]) {
    assert.equal(parseLikertRaw(v), v, `numeric ${v}`);
    assert.equal(parseLikertRaw(String(v)), v, `string ${v}`);
  }
  assert.equal(parseLikertRaw(undefined), null);
  assert.equal(parseLikertRaw(null), null);
  assert.equal(parseLikertRaw(""), null);
  assert.equal(parseLikertRaw("   "), null);
  assert.equal(parseLikertRaw("0"), null);
  assert.equal(parseLikertRaw(0), null);
  assert.equal(parseLikertRaw("6"), null);
  assert.equal(parseLikertRaw(6), null);
  assert.equal(parseLikertRaw("-1"), null);
  assert.equal(parseLikertRaw(-1), null);
  assert.equal(parseLikertRaw("3.5"), null);
  assert.equal(parseLikertRaw(3.5), null);
  assert.equal(parseLikertRaw("abc"), null);
  assert.equal(parseLikertRaw({ choice: "6" }), null);
  assert.equal(parseLikertRaw({ choice: "" }), null);

  const ORD = ["m01-ord-1", "m01-ord-2", "m01-ord-3", "m01-ord-4", "m01-ord-5", "m01-ord-6", "m01-ord-8"] as const;
  function allOrd(v: number) {
    const a: Record<string, string> = {};
    for (const id of ORD) a[id] = String(v);
    return a;
  }
  function orgRow(answers: Record<string, unknown>) {
    const s = buildTemperamentSnapshotV2(answers, {});
    return s.sections
      .find((sec) => sec.groupTitle.includes("Organization"))!
      .rows.find((r) => r.rowId === "org_structure_vs_spontaneity")!;
  }
  function orgBand(answers: Record<string, unknown>) {
    return orgRow(answers).viewer.band;
  }

  assert.equal(orgBand(allOrd(5)), "moderate");
  assert.equal(orgBand(allOrd(1)), "moderate");
  assert.equal(
    orgBand({
      "m01-ord-1": "5",
      "m01-ord-2": "1",
      "m01-ord-3": "5",
      "m01-ord-4": "5",
      "m01-ord-5": "1",
      "m01-ord-6": "1",
      "m01-ord-8": "5",
    }),
    "higher_agreement",
  );
  assert.equal(
    orgBand({
      "m01-ord-1": "1",
      "m01-ord-2": "5",
      "m01-ord-3": "1",
      "m01-ord-4": "1",
      "m01-ord-5": "5",
      "m01-ord-6": "5",
      "m01-ord-8": "1",
    }),
    "lower_agreement",
  );
  assert.equal(orgBand(allOrd(3)), "moderate");

  const invalidEmptyDistort = orgRow({
    "m01-ord-1": "",
    "m01-ord-2": "2",
    "m01-ord-3": "5",
    "m01-ord-4": "5",
    "m01-ord-5": "1",
    "m01-ord-6": "1",
    "m01-ord-8": "5",
  });
  assert.equal(invalidEmptyDistort.viewer.answeredCount, 6, "empty string not counted");
  assert.equal(invalidEmptyDistort.viewer.status, "scored");

  const invalidZero = orgRow({
    "m01-ord-1": "0",
    "m01-ord-2": "2",
    "m01-ord-3": "5",
    "m01-ord-4": "5",
    "m01-ord-5": "1",
    "m01-ord-6": "1",
    "m01-ord-8": "5",
  });
  assert.equal(invalidZero.viewer.answeredCount, 6);

  const belowMin = orgRow({ "m01-ord-1": "5", "m01-ord-3": "5" });
  assert.equal(belowMin.viewer.status, "insufficient_data");
  assert.equal(belowMin.viewer.band, undefined);

  const reverseSkip = orgRow({
    "m01-ord-1": "5",
    "m01-ord-2": "__skip__",
    "m01-ord-3": "5",
    "m01-ord-4": "5",
    "m01-ord-5": "__skip__",
    "m01-ord-6": "1",
    "m01-ord-8": "5",
  });
  assert.equal(reverseSkip.viewer.answeredCount, 5);
  assert.equal(reverseSkip.viewer.status, "scored");
  assert.equal(reverseSkip.viewer.band, "higher_agreement");

  const orgAll = {
    "m01-ord-1": "5",
    "m01-ord-2": "1",
    "m01-ord-3": "5",
    "m01-ord-4": "5",
    "m01-ord-5": "1",
    "m01-ord-6": "1",
    "m01-ord-8": "5",
  };
  const orgMin = { "m01-ord-1": "1", "m01-ord-3": "1", "m01-ord-4": "1", "m01-ord-8": "1" };
  const dual = buildTemperamentSnapshotV2(orgAll, orgMin);
  const dualOrg = dual.sections
    .find((sec) => sec.groupTitle.includes("Organization"))!
    .rows.find((r) => r.rowId === "org_structure_vs_spontaneity")!;
  assert.equal(dualOrg.viewer.answeredCount, 7);
  assert.equal(dualOrg.partner.answeredCount, 4);
  assert.equal(dualOrg.viewer.status, "scored");
  assert.equal(dualOrg.partner.status, "scored");
  assert.notEqual(dualOrg.viewer.band, dualOrg.partner.band);

  assert.equal(agreementBandFromMean(2.2), "lower_agreement");
  assert.equal(agreementBandFromMean(2.21), "moderate");
  assert.equal(agreementBandFromMean(3.79), "moderate");
  assert.equal(agreementBandFromMean(3.8), "higher_agreement");

  const mod = buildMod01TemperamentModule();
  const privateSecret = "PRIVATE-REFLECTION-SECRET-991";
  const answersA: Record<string, unknown> = {
    "m01-reflect-hopes": privateSecret,
    "m01-soc-2": "5",
    "m01-soc-4": "5",
    "m01-soc-6": "5",
    "m01-soc-7": "5",
    "m01-soc-9": "5",
    "m01-soc-1": "5",
    "m01-soc-3": "5",
    "m01-soc-8": "5",
  };
  const answersB: Record<string, unknown> = {
    "m01-soc-2": "1",
    "m01-soc-4": "1",
    "m01-soc-6": "1",
    "m01-soc-7": "1",
    "m01-soc-9": "1",
    "m01-soc-1": "1",
    "m01-soc-3": "1",
    "m01-soc-8": "1",
  };

  const snap = buildTemperamentSnapshotV2(answersA, answersB);
  assert.equal(snap.scoringModelVersion, TEMPERAMENT_SCORING_V2);
  const json = JSON.stringify(snap);
  assert.ok(!json.includes(privateSecret), "no private text in snapshot");
  assert.ok(!json.includes('"5"'), "no raw likert values in snapshot JSON");

  const social = snap.sections.find((s) => s.groupTitle.includes("Social energy"))!;
  const stim = social.rows.find((r) => r.rowId === "social_stimulation")!;
  const quiet = social.rows.find((r) => r.rowId === "social_quiet_recovery")!;
  assert.equal(stim.viewer.status, "scored");
  assert.equal(quiet.viewer.status, "scored");
  assert.equal(stim.viewer.band, "higher_agreement");
  assert.equal(quiet.viewer.band, "higher_agreement");
  assert.equal(stim.partner.band, "lower_agreement");

  const answersHighStimLowQuiet: Record<string, unknown> = {
    "m01-soc-2": "5",
    "m01-soc-4": "5",
    "m01-soc-6": "5",
    "m01-soc-7": "5",
    "m01-soc-9": "5",
    "m01-soc-1": "1",
    "m01-soc-3": "1",
    "m01-soc-8": "1",
  };
  const mixed = buildTemperamentSnapshotV2(answersHighStimLowQuiet, answersHighStimLowQuiet);
  const ms = mixed.sections.find((s) => s.groupTitle.includes("Social"))!;
  assert.equal(ms.rows.find((r) => r.rowId === "social_stimulation")!.viewer.band, "higher_agreement");
  assert.equal(ms.rows.find((r) => r.rowId === "social_quiet_recovery")!.viewer.band, "lower_agreement");

  const conflictA = { "m01-con-1": "5", "m01-con-2": "3", "m01-con-3": "3", "m01-con-4": "3" };
  const conflictB = { "m01-con-1": "1", "m01-con-2": "5", "m01-con-3": "5", "m01-con-4": "5" };
  const cSnap = buildTemperamentSnapshotV2(conflictA, conflictB);
  const conflictSec = cSnap.sections.find((s) => s.groupTitle.includes("conflict"))!;
  const tone = conflictSec.rows.find((r) => r.rowId === "conflict_tone_harshness_sensitivity")!;
  const space = conflictSec.rows.find((r) => r.rowId === "ind_conflict_need_physical_space")!;
  assert.equal(tone.viewer.status, "scored");
  assert.equal(space.viewer.status, "scored");
  assert.notEqual(tone.viewer.band, space.partner.band);

  const orgAnswers = {
    "m01-ord-1": "5",
    "m01-ord-2": "1",
    "m01-ord-3": "5",
    "m01-ord-4": "5",
    "m01-ord-5": "1",
    "m01-ord-6": "1",
    "m01-ord-8": "5",
  };
  const orgSnap = buildTemperamentSnapshotV2(orgAnswers, orgAnswers);
  const orgRowScored = orgSnap.sections
    .find((s) => s.groupTitle.includes("Organization"))!
    .rows.find((r) => r.rowId === "org_structure_vs_spontaneity")!;
  assert.equal(orgRowScored.viewer.status, "scored");
  assert.ok(orgRowScored.viewer.summaryLabel!.includes("structure"), "reverse scoring raises structure lean");

  const sparse = buildTemperamentSnapshotV2({ "m01-soc-2": "4" }, { "m01-soc-2": "2" });
  const sparseStim = sparse.sections[0].rows.find((r) => r.rowId === "social_stimulation")!;
  assert.equal(sparseStim.viewer.status, "insufficient_data");

  const skipped = buildTemperamentSnapshotV2(
    { "m01-soc-2": "__skip__", "m01-soc-4": "4", "m01-soc-6": "4" },
    {},
  );
  assert.equal(
    skipped.sections[0].rows.find((r) => r.rowId === "social_stimulation")!.viewer.status,
    "insufficient_data",
  );

  const perspectiveA = buildTemperamentSnapshotV2(
    { "m01-emo-2": "5", "m01-emo-5": "5", "m01-emo-9": "5" },
    { "m01-emo-2": "1", "m01-emo-5": "1", "m01-emo-9": "1" },
  );
  const perspectiveB = buildTemperamentSnapshotV2(
    { "m01-emo-2": "1", "m01-emo-5": "1", "m01-emo-9": "1" },
    { "m01-emo-2": "5", "m01-emo-5": "5", "m01-emo-9": "5" },
  );
  const emoA = perspectiveA.sections[1].rows.find((r) => r.rowId === "emotion_outward_expression")!;
  const emoB = perspectiveB.sections[1].rows.find((r) => r.rowId === "emotion_outward_expression")!;
  assert.equal(emoA.viewer.band, "higher_agreement");
  assert.equal(emoA.partner.band, "lower_agreement");
  assert.equal(emoB.viewer.band, "lower_agreement");
  assert.equal(emoB.partner.band, "higher_agreement");

  const v1 = buildTemperamentInsights(mod.questions, { "m01-soc-1": "5" }, { "m01-soc-1": "1" });
  assert.ok(v1.length >= 5, "v1 legacy still produces dimension rows");

  const frozen = freezeStage2ModulesIntoSnapshot([]);
  const frozenMod = frozen.find((m) => m.id === "s2-temperament-discovery")!;
  const frozenLikert = frozenMod.questions
    .filter((q) => q.type === "likert" && q.temperamentDimension)
    .map((q) => q.id);
  assertTemperamentV2ConfigIntegrity(frozenLikert);

  const filtered = filterTemperamentScoringAnswers(
    mod.questions,
    {
      "m01-reflect-hopes": privateSecret,
      "m01-soc-1": "4",
    },
    new Set(["m01-soc-1"]),
  );
  assert.equal(filtered["m01-soc-1"], "4");
  assert.equal(filtered["m01-reflect-hopes"], undefined);

  const badFilter = filterTemperamentScoringAnswers(
    mod.questions,
    { "m01-reflect-hopes": "should not leak" },
    new Set(["m01-reflect-hopes", "m01-soc-1"]),
  );
  assert.equal(badFilter["m01-reflect-hopes"], undefined, "private_reflection never in scoring input");

  const subscaleRows = snap.sections.flatMap((s) => s.rows.filter((r) => r.rowKind === "subscale"));
  assert.equal(subscaleRows.length, 7, "seven subscale rows across sections");

  console.log("marriage-stage2-temperament-scoring.test.ts: OK");
}

run();
