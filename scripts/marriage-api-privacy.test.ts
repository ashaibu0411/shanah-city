/**
 * Server comparison serialization rules (visibility + consent helpers used by GET comparison).
 * Run: npx tsx scripts/marriage-api-privacy.test.ts
 */
import assert from "node:assert/strict";
import { buildComparisonItemsWithConsent } from "../src/lib/marriage-stage2-activity-engine";
import type { MarriageQuestionDefinition } from "../src/lib/marriage-counseling-types";

const journeyId = "j-test";
const moduleId = "mod-test";
const viewerId = "u-a";
const partnerId = "u-b";

function q(
  id: string,
  visibility: MarriageQuestionDefinition["visibility"],
  extra?: Partial<MarriageQuestionDefinition>,
): MarriageQuestionDefinition {
  return {
    id,
    moduleId,
    prompt: id,
    type: "short_answer",
    required: false,
    visibility,
    ...extra,
  };
}

function run() {
  const questions = [
    q("priv-reflect", "private_reflection"),
    q("priv-fin", "private_financial_disclosure"),
    q("counselor", "counselor_with_consent"),
    q("shared", "shared_after_both_submit"),
    q("explicit", "explicit_consent_to_share", { sensitivity: "high" }),
  ];
  const answersA = {
    "priv-reflect": "secret-a-reflect",
    "priv-fin": "secret-a-fin",
    counselor: "secret-a-counselor",
    shared: "shared-a",
    explicit: "secret-a-explicit",
  };
  const answersB = {
    "priv-reflect": "secret-b-reflect",
    "priv-fin": "secret-b-fin",
    counselor: "secret-b-counselor",
    shared: "shared-b",
    explicit: "secret-b-explicit",
  };

  const none = buildComparisonItemsWithConsent(
    questions,
    answersA,
    answersB,
    viewerId,
    partnerId,
    journeyId,
    moduleId,
    [],
  );
  assert.deepEqual(
    none.map((i) => i.questionId),
    ["shared"],
    "only shared_after_both_submit without extra consent",
  );

  const oneConsent = buildComparisonItemsWithConsent(
    questions,
    answersA,
    answersB,
    viewerId,
    partnerId,
    journeyId,
    moduleId,
    [{ journeyId, moduleId, questionId: "explicit", userId: viewerId, granted: true, updatedAt: "" }],
  );
  assert.deepEqual(
    oneConsent.map((i) => i.questionId),
    ["shared"],
    "explicit consent requires both partners",
  );

  const bothConsent = buildComparisonItemsWithConsent(
    questions,
    answersA,
    answersB,
    viewerId,
    partnerId,
    journeyId,
    moduleId,
    [
      { journeyId, moduleId, questionId: "explicit", userId: viewerId, granted: true, updatedAt: "" },
      { journeyId, moduleId, questionId: "explicit", userId: partnerId, granted: true, updatedAt: "" },
    ],
  );
  assert.deepEqual(
    bothConsent.map((i) => i.questionId).sort(),
    ["explicit", "shared"],
    "explicit included when both grant consent",
  );

  const text = JSON.stringify(bothConsent);
  assert.ok(!text.includes("secret-a-reflect"));
  assert.ok(!text.includes("secret-b-counselor"));
  assert.ok(!text.includes("secret-a-fin"));

  console.log("marriage-api-privacy.test.ts: OK");
}

run();
