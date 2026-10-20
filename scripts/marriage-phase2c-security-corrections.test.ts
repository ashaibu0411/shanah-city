/**
 * Phase 2C security corrections — JSON store + pure helpers (no PostgreSQL).
 * Run: npx.cmd tsx scripts/marriage-phase2c-security-corrections.test.ts
 *
 * PostgreSQL journey-lock + concurrent grant/revoke: UNVERIFIED (requires isolated Postgres).
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PublicMember } from "../src/lib/auth-types";
import { COUNSELOR_JOURNEY_ACCESS_PATCH_FORBIDDEN } from "../src/lib/marriage-counselor-assignment-change";
import {
  counselorConsentGrantVersionFromModuleStatus,
  grantCounselorAnswerConsent,
  listCounselorConsentStatusForModule,
  resolveCounselorConsentUiState,
  revokeCounselorAnswerConsent,
} from "../src/lib/marriage-counselor-consent-participant";
import { buildCounselorAuthorizedAnswerViews } from "../src/lib/marriage-counselor-clinical-detail";
import { computeAnswerFingerprint } from "../src/lib/marriage-counselor-consent";
import { revokeCounselorAccess } from "../src/lib/marriage-counseling-privacy-server";
import { consentGranted } from "../src/lib/marriage-stage2-activity-engine";

function member(id: string): PublicMember {
  return { id, name: id, email: `${id}@test.local`, role: "member" } as PublicMember;
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

async function setupJourney(counselorId: string) {
  const dir = mkdtempSync(join(tmpdir(), "marriage-p2c-sec-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage.json");
  delete process.env.DATABASE_URL;
  process.env.MARRIAGE_COUNSELOR_USER_IDS = `${counselorId},c-other,c-a,c-b`;

  const jsonStore = await import("../src/lib/stores/marriage-counseling-json");
  const journey = await jsonStore.createJourney({
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: null,
    counselorUserId: "c-a",
    createdBy: "u-a",
    participantAId: "u-a",
    participantBId: "u-b",
    guidedModuleIds: ["mod-02-family-background"],
  });

  const modId = "mod-02-family-background";
  const questionId = "fb-sensitive";
  await jsonStore.saveResponse({
    id: "r1",
    journeyId: journey.id,
    moduleId: modId,
    contentVersion: "v1",
    userId: "u-a",
    status: "submitted",
    answers: { [questionId]: "Clinical secret text" },
    lastSavedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  });

  return { dir, jsonStore, journey, modId, questionId };
}

async function testReassignmentABA() {
  const { dir, jsonStore, journey, modId, questionId } = await setupJourney("c-a");

  await grantAtListedVersion(member("u-a"), journey.id, modId, questionId);

  await jsonStore.applyCounselorJourneyAccessChange(journey.id, { counselorUserId: "c-b" });
  let j2 = await jsonStore.getJourneyById(journey.id);
  assert.equal(j2?.counselorUserId, "c-b");
  let viewsB = await buildCounselorAuthorizedAnswerViews(member("c-b"), j2!);
  assert.equal(viewsB.find((v) => v.questionId === questionId)?.withheld, true);

  await jsonStore.applyCounselorJourneyAccessChange(journey.id, { counselorUserId: "c-a" });
  j2 = await jsonStore.getJourneyById(journey.id);
  const viewsA = await buildCounselorAuthorizedAnswerViews(member("c-a"), j2!);
  assert.equal(viewsA.find((v) => v.questionId === questionId)?.withheld, true, "A→B→A must not restore consent");

  const status = await listCounselorConsentStatusForModule(member("u-a"), journey.id, modId);
  assert.notEqual(status.items.find((i) => i.questionId === questionId)?.state, "shared_with_counselor");

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

async function testUnassignInvalidatesConsent() {
  const { dir, jsonStore, journey, modId, questionId } = await setupJourney("c-a");
  await grantAtListedVersion(member("u-a"), journey.id, modId, questionId);

  await jsonStore.applyCounselorJourneyAccessChange(journey.id, { counselorUserId: null });
  const row = (await jsonStore.listSharingConsents(journey.id, modId)).find(
    (c) => c.questionId === questionId,
  );
  assert.equal(row?.counselorDisclosureGranted, false);
  assert.equal(row?.consentedCounselorUserId, null);

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

async function testRevokeCounselorAccessInvalidates() {
  const { dir, journey, modId, questionId } = await setupJourney("c-a");
  await grantAtListedVersion(member("u-a"), journey.id, modId, questionId);

  await revokeCounselorAccess(member("u-a"), journey.id);
  const status = await listCounselorConsentStatusForModule(member("u-a"), journey.id, modId);
  assert.equal(status.counselorAccessRevoked, true);
  assert.equal(status.items.find((i) => i.questionId === questionId)?.state, "not_shared");

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

async function testFormerCounselorDenied() {
  const { dir, jsonStore, journey, modId, questionId } = await setupJourney("c-a");
  await grantAtListedVersion(member("u-a"), journey.id, modId, questionId);

  let j = await jsonStore.getJourneyById(journey.id);
  let allowed = await buildCounselorAuthorizedAnswerViews(member("c-a"), j!);
  assert.equal(allowed.find((v) => v.questionId === questionId)?.withheld, false);

  await jsonStore.applyCounselorJourneyAccessChange(journey.id, { counselorUserId: "c-b" });
  j = await jsonStore.getJourneyById(journey.id);
  const former = await buildCounselorAuthorizedAnswerViews(member("c-a"), j!);
  assert.equal(former.find((v) => v.questionId === questionId)?.withheld, true);

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

async function testPartnerSharingUnaffectedByCounselorRevoke() {
  const { dir, jsonStore, journey, modId } = await setupJourney("c-a");
  const partnerQ = "pq-partner";

  await jsonStore.savePartnerSharingConsent({
    journeyId: journey.id,
    moduleId: modId,
    questionId: partnerQ,
    userId: "u-a",
    granted: true,
    updatedAt: new Date().toISOString(),
  });

  await grantAtListedVersion(member("u-a"), journey.id, modId, "fb-sensitive");
  await revokeCounselorAnswerConsent(member("u-a"), journey.id, modId, "fb-sensitive");

  const partnerRow = (await jsonStore.listSharingConsents(journey.id, modId)).find(
    (c) => c.questionId === partnerQ,
  );
  assert.equal(partnerRow?.granted, true);

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

async function testPartnerAndCounselorIndependence() {
  const { dir, jsonStore, journey, modId } = await setupJourney("c-a");
  const partnerQ = "pq2";

  await jsonStore.savePartnerSharingConsent({
    journeyId: journey.id,
    moduleId: modId,
    questionId: partnerQ,
    userId: "u-a",
    granted: true,
    updatedAt: new Date().toISOString(),
  });

  await grantAtListedVersion(member("u-a"), journey.id, modId, "fb-sensitive");
  const consents = await jsonStore.listSharingConsents(journey.id, modId);
  const counselorRow = consents.find((c) => c.questionId === "fb-sensitive");
  assert.equal(counselorRow?.counselorDisclosureGranted, true);
  assert.equal(counselorRow?.granted, false);

  await jsonStore.savePartnerSharingConsent({
    journeyId: journey.id,
    moduleId: modId,
    questionId: partnerQ,
    userId: "u-a",
    granted: false,
    updatedAt: new Date().toISOString(),
  });
  const afterPartnerRevoke = await jsonStore.listSharingConsents(journey.id, modId);
  const counselorAfter = afterPartnerRevoke.find((c) => c.questionId === "fb-sensitive");
  assert.equal(counselorAfter?.counselorDisclosureGranted, true);
  assert.equal(
    consentGranted(afterPartnerRevoke, journey.id, modId, partnerQ, "u-a"),
    false,
  );

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

async function testConsentStatusOwnAnswerOnlyForParticipant() {
  const { dir, jsonStore, journey, modId, questionId } = await setupJourney("c-a");
  await jsonStore.saveResponse({
    id: "rb",
    journeyId: journey.id,
    moduleId: modId,
    contentVersion: "v1",
    userId: "u-b",
    status: "submitted",
    answers: { [questionId]: "Spouse B clinical secret" },
    lastSavedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  });

  const statusA = await listCounselorConsentStatusForModule(member("u-a"), journey.id, modId);
  const statusB = await listCounselorConsentStatusForModule(member("u-b"), journey.id, modId);
  assert.ok(
    statusA.items.find((i) => i.questionId === questionId)?.savedAnswerDisplay?.includes("Clinical secret"),
  );
  assert.equal(JSON.stringify(statusA).includes("Spouse B clinical secret"), false);
  assert.ok(
    statusB.items.find((i) => i.questionId === questionId)?.savedAnswerDisplay?.includes(
      "Spouse B clinical secret",
    ),
  );
  assert.equal(JSON.stringify(statusB).includes("Clinical secret"), false);

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

async function testCrossSpouseGrantDenied() {
  const { dir, journey, modId, questionId } = await setupJourney("c-a");
  await assert.rejects(
    () =>
      grantCounselorAnswerConsent(member("u-stranger"), journey.id, modId, questionId, {
        answerFingerprint: "b".repeat(64),
        answerGeneration: 0,
      }),
    /not part of this journey/,
  );
  await grantAtListedVersion(member("u-a"), journey.id, modId, questionId);
  await assert.rejects(
    () =>
      grantCounselorAnswerConsent(member("u-b"), journey.id, modId, questionId, {
        answerFingerprint: "c".repeat(64),
        answerGeneration: 0,
      }),
    /Submit this assessment before sharing/,
  );

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

function testUiStateAfterReassignment() {
  const journey = {
    id: "j",
    counselorUserId: "c-new",
  } as import("../src/lib/marriage-counseling-types").MarriageCounselingJourneyRecord;
  const consent = {
    journeyId: "j",
    moduleId: "m",
    questionId: "q",
    userId: "u",
    granted: false,
    counselorDisclosureGranted: true,
    updatedAt: "",
    consentedCounselorUserId: "c-old",
    generationAtGrant: 0,
    answerFingerprint: computeAnswerFingerprint("x"),
    grantedAt: "",
  };
  const state = resolveCounselorConsentUiState({
    journey,
    consent,
    currentGeneration: 0,
    currentAnswer: "x",
  });
  assert.equal(state, "withdrawn");
}

async function testGenericUpdateJourneyFailsClosed() {
  const { dir, jsonStore, journey } = await setupJourney("c-a");
  await assert.rejects(
    () => jsonStore.updateJourney(journey.id, { counselorUserId: "c-b" }),
    (err: Error) => {
      assert.equal(err.message, COUNSELOR_JOURNEY_ACCESS_PATCH_FORBIDDEN);
      return true;
    },
  );

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

async function main() {
  testUiStateAfterReassignment();
  await testReassignmentABA();
  await testUnassignInvalidatesConsent();
  await testRevokeCounselorAccessInvalidates();
  await testFormerCounselorDenied();
  await testPartnerSharingUnaffectedByCounselorRevoke();
  await testPartnerAndCounselorIndependence();
  await testConsentStatusOwnAnswerOnlyForParticipant();
  await testCrossSpouseGrantDenied();
  await testGenericUpdateJourneyFailsClosed();
  console.log("marriage-phase2c-security-corrections.test.ts: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
