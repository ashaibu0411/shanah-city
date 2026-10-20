/**
 * Counselor consent race invariants (database-free).
 * Proves stale fingerprint/generation cannot pass verify, and ordered grant/edit outcomes.
 *
 * Run: npx.cmd tsx scripts/marriage-counselor-consent-race-invariants.test.ts
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PublicMember } from "../src/lib/auth-types";
import { getChangedCounselorConsentQuestionIds } from "../src/lib/marriage-assessment-answer-changes";
import {
  computeAnswerFingerprint,
  verifyCounselorAnswerDisclosure,
} from "../src/lib/marriage-counselor-consent";
import {
  counselorConsentGrantVersionFromModuleStatus,
  grantCounselorAnswerConsent,
  listCounselorConsentStatusForModule,
} from "../src/lib/marriage-counselor-consent-participant";
import type { MarriageSharingConsentRecord } from "../src/lib/marriage-counseling-types";

function member(id: string): PublicMember {
  return { id, name: id, email: `${id}@test.local`, role: "member" } as PublicMember;
}

function testVerifyRejectsStaleFingerprint() {
  const original = "answer-alpha";
  const edited = "answer-alpha-race-edit";
  const consent: MarriageSharingConsentRecord = {
    journeyId: "j1",
    moduleId: "m1",
    questionId: "q1",
    userId: "u1",
    granted: false,
    counselorDisclosureGranted: true,
    updatedAt: new Date().toISOString(),
    consentedCounselorUserId: "c1",
    generationAtGrant: 0,
    answerFingerprint: computeAnswerFingerprint(original),
    grantedAt: new Date().toISOString(),
  };
  const check = verifyCounselorAnswerDisclosure({
    consent,
    currentGeneration: 0,
    assignedCounselorUserId: "c1",
    viewerCounselorUserId: "c1",
    currentAnswer: edited,
  });
  assert.equal(check.allowed, false);
  assert.equal(check.reason, "fingerprint_mismatch");
}

async function testGrantThenEditInvalidatesDisclosure() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-race-gte-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage.json");
  delete process.env.DATABASE_URL;

  const jsonStore = await import("../src/lib/stores/marriage-counseling-json");
  const modId = "mod-02-family-background";
  const questionId = "fb-sensitive";
  const journey = await jsonStore.createJourney({
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: modId,
    counselorUserId: "c1",
    createdBy: "u-a",
    participantAId: "u-a",
    participantBId: "u-b",
    guidedModuleIds: [modId],
  });

  const original = "baseline-answer";
  const edited = `${original}-edited`;
  await jsonStore.saveResponse({
    id: "r1",
    journeyId: journey.id,
    moduleId: modId,
    contentVersion: "v1",
    userId: "u-a",
    status: "submitted",
    answers: { [questionId]: original },
    lastSavedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  });

  {
    const status = await listCounselorConsentStatusForModule(member("u-a"), journey.id, modId);
    const version = counselorConsentGrantVersionFromModuleStatus(status, questionId);
    await grantCounselorAnswerConsent(member("u-a"), journey.id, modId, questionId, version);
  }

  const { getModuleDefinition } = await import("../src/lib/marriage-curriculum-service");
  const mod = await getModuleDefinition(modId);
  assert.ok(mod);
  const changed = getChangedCounselorConsentQuestionIds(
    mod.questions,
    { [questionId]: original },
    { [questionId]: edited },
  );
  assert.ok(changed.includes(questionId));

  await jsonStore.saveAssessmentResponseWithCounselorConsentInvalidation(
    {
      id: "r1",
      journeyId: journey.id,
      moduleId: modId,
      contentVersion: "v1",
      userId: "u-a",
      status: "submitted",
      answers: { [questionId]: edited },
      lastSavedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    },
    changed,
  );

  const consents = await jsonStore.listSharingConsents(journey.id, modId);
  const consent = consents.find((c) => c.questionId === questionId && c.userId === "u-a");
  assert.ok(consent);
  const generation = (await jsonStore.getAnswerChangeGeneration(
    journey.id,
    modId,
    questionId,
    "u-a",
  )) ?? 0;

  const check = verifyCounselorAnswerDisclosure({
    consent,
    currentGeneration: generation,
    assignedCounselorUserId: "c1",
    viewerCounselorUserId: "c1",
    currentAnswer: edited,
  });
  assert.equal(check.allowed, false);

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

async function testEditThenStaleFingerprintGrantRejected() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-race-etg-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage.json");
  delete process.env.DATABASE_URL;

  const jsonStore = await import("../src/lib/stores/marriage-counseling-json");
  const modId = "mod-02-family-background";
  const questionId = "fb-sensitive";
  const journey = await jsonStore.createJourney({
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: modId,
    counselorUserId: "c1",
    createdBy: "u-a",
    participantAId: "u-a",
    participantBId: "u-b",
    guidedModuleIds: [modId],
  });

  const original = "baseline-answer";
  const edited = `${original}-edited`;
  await jsonStore.saveResponse({
    id: "r1",
    journeyId: journey.id,
    moduleId: modId,
    contentVersion: "v1",
    userId: "u-a",
    status: "submitted",
    answers: { [questionId]: edited },
    lastSavedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  });

  const staleFp = computeAnswerFingerprint(original);
  await assert.rejects(
    () =>
      jsonStore.applyCounselorConsentGrant({
        journeyId: journey.id,
        moduleId: modId,
        questionId,
        userId: "u-a",
        expectedCounselorUserId: "c1",
        answerFingerprint: staleFp,
        answerGeneration: 0,
      }),
    /Your answer has changed/,
  );

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

async function main() {
  testVerifyRejectsStaleFingerprint();
  await testGrantThenEditInvalidatesDisclosure();
  await testEditThenStaleFingerprintGrantRejected();
  console.log("marriage-counselor-consent-race-invariants.test.ts: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
