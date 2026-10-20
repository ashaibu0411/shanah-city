/**
 * Phase 3F — participant consent version binding (JSON store, no database).
 * Run: npx.cmd tsx scripts/marriage-counselor-consent-version-binding.test.ts
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PublicMember } from "../src/lib/auth-types";
import { getChangedCounselorConsentQuestionIds } from "../src/lib/marriage-assessment-answer-changes";
import {
  answerValuesEqual,
  computeAnswerFingerprint,
  COUNSELOR_CONSENT_ANSWER_CHANGED_MESSAGE,
} from "../src/lib/marriage-counselor-consent";
import {
  counselorConsentGrantVersionFromModuleStatus,
  grantCounselorAnswerConsent,
  listCounselorConsentStatusForModule,
  revokeCounselorAnswerConsent,
} from "../src/lib/marriage-counselor-consent-participant";

function member(id: string): PublicMember {
  return { id, name: id, email: `${id}@test.local`, role: "member" } as PublicMember;
}

async function setupJourney() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-3f-"));
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

  return { dir, jsonStore, journey, modId, questionId };
}

async function grantAtListedVersion(
  viewer: PublicMember,
  journeyId: string,
  modId: string,
  questionId: string,
) {
  const status = await listCounselorConsentStatusForModule(viewer, journeyId, modId);
  const version = counselorConsentGrantVersionFromModuleStatus(status, questionId);
  return grantCounselorAnswerConsent(viewer, journeyId, modId, questionId, version);
}

/** A — displayed version matches stored answer: grant permitted. */
async function testMatchingVersionGrantPermitted() {
  const { dir, journey, modId, questionId, jsonStore } = await setupJourney();
  const answer = "version-a-saved-answer";
  await jsonStore.saveResponse({
    id: "r1",
    journeyId: journey.id,
    moduleId: modId,
    contentVersion: "v1",
    userId: "u-a",
    status: "submitted",
    answers: { [questionId]: answer },
    lastSavedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  });

  const status = await listCounselorConsentStatusForModule(member("u-a"), journey.id, modId);
  const item = status.items.find((i) => i.questionId === questionId);
  assert.ok(item);
  assert.ok(item.savedAnswerDisplay?.includes(answer));
  assert.equal(item.answerFingerprint, computeAnswerFingerprint(answer));

  await grantAtListedVersion(member("u-a"), journey.id, modId, questionId);
  const after = await listCounselorConsentStatusForModule(member("u-a"), journey.id, modId);
  assert.equal(after.items.find((i) => i.questionId === questionId)?.state, "shared_with_counselor");

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

/** B — answer changes after display: stale fingerprint rejected. */
async function testStaleFingerprintRejected() {
  const { dir, journey, modId, questionId, jsonStore } = await setupJourney();
  const original = "displayed-then-changed";
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

  const status = await listCounselorConsentStatusForModule(member("u-a"), journey.id, modId);
  const staleVersion = counselorConsentGrantVersionFromModuleStatus(status, questionId);

  const edited = `${original}-server-edit`;
  const { getModuleDefinition } = await import("../src/lib/marriage-curriculum-service");
  const mod = await getModuleDefinition(modId);
  assert.ok(mod);
  const changed = getChangedCounselorConsentQuestionIds(
    mod.questions,
    { [questionId]: original },
    { [questionId]: edited },
  );
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

  await assert.rejects(
    () => grantCounselorAnswerConsent(member("u-a"), journey.id, modId, questionId, staleVersion),
    (err: unknown) =>
      err instanceof Error && err.message === COUNSELOR_CONSENT_ANSWER_CHANGED_MESSAGE,
  );

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

/** C — concurrent edit before grant: stale generation rejected. */
async function testStaleGenerationRejected() {
  const { dir, journey, modId, questionId, jsonStore } = await setupJourney();
  const answer = "gen-bound-answer";
  await jsonStore.saveResponse({
    id: "r1",
    journeyId: journey.id,
    moduleId: modId,
    contentVersion: "v1",
    userId: "u-a",
    status: "submitted",
    answers: { [questionId]: answer },
    lastSavedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  });

  const status = await listCounselorConsentStatusForModule(member("u-a"), journey.id, modId);
  const staleVersion = counselorConsentGrantVersionFromModuleStatus(status, questionId);
  assert.equal(staleVersion.answerGeneration, 0);

  await jsonStore.incrementAnswerChangeGeneration(journey.id, modId, questionId, "u-a");

  await assert.rejects(
    () => grantCounselorAnswerConsent(member("u-a"), journey.id, modId, questionId, staleVersion),
    (err: unknown) =>
      err instanceof Error && err.message === COUNSELOR_CONSENT_ANSWER_CHANGED_MESSAGE,
  );

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

/** D — after refresh, new explicit grant with current version permitted. */
async function testRefreshThenNewGrantPermitted() {
  const { dir, journey, modId, questionId, jsonStore } = await setupJourney();
  const v1 = "first-save";
  const v2 = "second-save";
  await jsonStore.saveResponse({
    id: "r1",
    journeyId: journey.id,
    moduleId: modId,
    contentVersion: "v1",
    userId: "u-a",
    status: "submitted",
    answers: { [questionId]: v1 },
    lastSavedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  });

  const stale = counselorConsentGrantVersionFromModuleStatus(
    await listCounselorConsentStatusForModule(member("u-a"), journey.id, modId),
    questionId,
  );

  const { getModuleDefinition } = await import("../src/lib/marriage-curriculum-service");
  const mod = await getModuleDefinition(modId);
  assert.ok(mod);
  await jsonStore.saveAssessmentResponseWithCounselorConsentInvalidation(
    {
      id: "r1",
      journeyId: journey.id,
      moduleId: modId,
      contentVersion: "v1",
      userId: "u-a",
      status: "submitted",
      answers: { [questionId]: v2 },
      lastSavedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    },
    getChangedCounselorConsentQuestionIds(
      mod.questions,
      { [questionId]: v1 },
      { [questionId]: v2 },
    ),
  );

  await assert.rejects(
    () => grantCounselorAnswerConsent(member("u-a"), journey.id, modId, questionId, stale),
    (err: unknown) =>
      err instanceof Error && err.message === COUNSELOR_CONSENT_ANSWER_CHANGED_MESSAGE,
  );

  await grantAtListedVersion(member("u-a"), journey.id, modId, questionId);
  const after = await listCounselorConsentStatusForModule(member("u-a"), journey.id, modId);
  assert.equal(after.items.find((i) => i.questionId === questionId)?.state, "shared_with_counselor");
  assert.equal(
    after.items.find((i) => i.questionId === questionId)?.answerFingerprint,
    computeAnswerFingerprint(v2),
  );

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

/** E — unsaved local edits: binding gate blocks grant (client rule). */
function testUnsavedLocalEditsBlockBinding() {
  const saved = "persisted-on-server";
  const localDraft = `${saved}-unsaved`;
  assert.ok(!answerValuesEqual(localDraft, saved));
  const wouldDisableGrant = !answerValuesEqual(localDraft, saved);
  assert.equal(wouldDisableGrant, true);
}

/** F — revocation remains effective. */
async function testRevocationEffective() {
  const { dir, journey, modId, questionId, jsonStore } = await setupJourney();
  await jsonStore.saveResponse({
    id: "r1",
    journeyId: journey.id,
    moduleId: modId,
    contentVersion: "v1",
    userId: "u-a",
    status: "submitted",
    answers: { [questionId]: "revoke-me" },
    lastSavedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  });

  await grantAtListedVersion(member("u-a"), journey.id, modId, questionId);
  await revokeCounselorAnswerConsent(member("u-a"), journey.id, modId, questionId);
  const status = await listCounselorConsentStatusForModule(member("u-a"), journey.id, modId);
  assert.equal(status.items.find((i) => i.questionId === questionId)?.state, "not_shared");

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

/** G — no cross-spouse answer disclosure in consent status. */
async function testNoCrossSpouseDisclosure() {
  const { dir, journey, modId, questionId, jsonStore } = await setupJourney();
  const secretA = "spouse-a-private-consent-text";
  const secretB = "spouse-b-private-consent-text";
  await jsonStore.saveResponse({
    id: "ra",
    journeyId: journey.id,
    moduleId: modId,
    contentVersion: "v1",
    userId: "u-a",
    status: "submitted",
    answers: { [questionId]: secretA },
    lastSavedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  });
  await jsonStore.saveResponse({
    id: "rb",
    journeyId: journey.id,
    moduleId: modId,
    contentVersion: "v1",
    userId: "u-b",
    status: "submitted",
    answers: { [questionId]: secretB },
    lastSavedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  });

  const statusA = await listCounselorConsentStatusForModule(member("u-a"), journey.id, modId);
  const statusB = await listCounselorConsentStatusForModule(member("u-b"), journey.id, modId);
  const itemA = statusA.items.find((i) => i.questionId === questionId);
  const itemB = statusB.items.find((i) => i.questionId === questionId);
  assert.ok(itemA?.savedAnswerDisplay?.includes(secretA));
  assert.ok(itemB?.savedAnswerDisplay?.includes(secretB));
  assert.equal(JSON.stringify(statusA).includes(secretB), false);
  assert.equal(JSON.stringify(statusB).includes(secretA), false);

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

async function main() {
  await testMatchingVersionGrantPermitted();
  await testStaleFingerprintRejected();
  await testStaleGenerationRejected();
  await testRefreshThenNewGrantPermitted();
  testUnsavedLocalEditsBlockBinding();
  await testRevocationEffective();
  await testNoCrossSpouseDisclosure();
  console.log("marriage-counselor-consent-version-binding.test.ts: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
