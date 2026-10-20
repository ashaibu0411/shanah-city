/**
 * Pure counselor consent helpers (no database).
 * Run: npx tsx scripts/marriage-counselor-consent.test.ts
 */
import assert from "node:assert/strict";
import {
  answerValuesEqual,
  computeAnswerFingerprint,
  counselorConsentGenerationValid,
  hasCompleteCounselorConsentMetadata,
  shouldIncrementGenerationForAnswerChange,
  verifyCounselorAnswerDisclosure,
} from "../src/lib/marriage-counselor-consent";
import type { MarriageSharingConsentRecord } from "../src/lib/marriage-counseling-types";

function baseConsent(over: Partial<MarriageSharingConsentRecord> = {}): MarriageSharingConsentRecord {
  return {
    journeyId: "j1",
    moduleId: "m1",
    questionId: "q1",
    userId: "u1",
    granted: false,
    counselorDisclosureGranted: true,
    updatedAt: new Date().toISOString(),
    consentedCounselorUserId: "counselor-a",
    generationAtGrant: 0,
    answerFingerprint: computeAnswerFingerprint("secret"),
    grantedAt: new Date().toISOString(),
    ...over,
  };
}

function run() {
  assert.equal(hasCompleteCounselorConsentMetadata({ ...baseConsent(), generationAtGrant: null }), false);
  assert.equal(hasCompleteCounselorConsentMetadata({ ...baseConsent(), consentedCounselorUserId: null }), false);
  assert.equal(hasCompleteCounselorConsentMetadata({ ...baseConsent(), answerFingerprint: null }), false);
  assert.equal(hasCompleteCounselorConsentMetadata({ ...baseConsent(), answerFingerprint: "not-a-hash" }), false);

  const missingFp = verifyCounselorAnswerDisclosure({
    consent: baseConsent({ answerFingerprint: null }),
    currentGeneration: 0,
    assignedCounselorUserId: "counselor-a",
    viewerCounselorUserId: "counselor-a",
    currentAnswer: "secret",
  });
  assert.equal(missingFp.allowed, false);

  const wrongFp = verifyCounselorAnswerDisclosure({
    consent: baseConsent({ answerFingerprint: computeAnswerFingerprint("other") }),
    currentGeneration: 0,
    assignedCounselorUserId: "counselor-a",
    viewerCounselorUserId: "counselor-a",
    currentAnswer: "secret",
  });
  assert.equal(wrongFp.allowed, false);
  assert.equal(
    hasCompleteCounselorConsentMetadata({
      journeyId: "j",
      moduleId: "m",
      questionId: "q",
      userId: "u",
      granted: true,
      counselorDisclosureGranted: false,
      updatedAt: new Date().toISOString(),
    }),
    false,
    "partner granted row without counselor disclosure flag is not counselor consent",
  );

  assert.ok(verifyCounselorAnswerDisclosure({
    consent: baseConsent(),
    currentGeneration: 0,
    assignedCounselorUserId: "counselor-a",
    viewerCounselorUserId: "counselor-a",
    currentAnswer: "secret",
  }).allowed);

  const afterEdit = verifyCounselorAnswerDisclosure({
    consent: baseConsent({ generationAtGrant: 0 }),
    currentGeneration: 1,
    assignedCounselorUserId: "counselor-a",
    viewerCounselorUserId: "counselor-a",
    currentAnswer: "secret",
  });
  assert.equal(afterEdit.allowed, false);
  if (!afterEdit.allowed) assert.equal(afterEdit.reason, "generation_mismatch");

  assert.ok(answerValuesEqual("a", "a"));
  assert.ok(shouldIncrementGenerationForAnswerChange("a", "b"));
  assert.equal(shouldIncrementGenerationForAnswerChange("same", "same"), false);

  const fp1 = computeAnswerFingerprint("hello");
  assert.ok(shouldIncrementGenerationForAnswerChange("hello", "world"));
  assert.ok(answerValuesEqual("hello", "hello"));
  const revert = verifyCounselorAnswerDisclosure({
    consent: baseConsent({ generationAtGrant: 0, answerFingerprint: fp1 }),
    currentGeneration: 2,
    assignedCounselorUserId: "counselor-a",
    viewerCounselorUserId: "counselor-a",
    currentAnswer: "hello",
  });
  assert.equal(revert.allowed, false, "edit-and-revert must not restore consent via fingerprint alone");

  assert.equal(counselorConsentGenerationValid(baseConsent({ generationAtGrant: 0 }), 0), true);
  assert.equal(counselorConsentGenerationValid(baseConsent({ generationAtGrant: 0 }), 1), false);

  console.log("marriage-counselor-consent.test.ts: OK");
}

run();
