/**
 * Phase 2A transaction-safety correction — pure + JSON store tests (no DATABASE_URL).
 * DB advisory-lock concurrency: UNVERIFIED (requires isolated Postgres).
 *
 * Run: npx.cmd tsx scripts/marriage-phase2a-concurrency.test.ts
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getChangedCounselorConsentQuestionIds,
  listCounselorWithConsentQuestionIds,
} from "../src/lib/marriage-assessment-answer-changes";
import type { MarriageQuestionDefinition } from "../src/lib/marriage-counseling-types";

function q(id: string, visibility: MarriageQuestionDefinition["visibility"]) {
  return {
    id,
    moduleId: "mod1",
    prompt: id,
    type: "short_answer" as const,
    required: false,
    visibility,
  };
}

const QUESTIONS = [
  q("cq-a", "counselor_with_consent"),
  q("cq-b", "counselor_with_consent"),
  q("partner-q", "shared_after_both_submit"),
];

function testChangedQuestionDetection() {
  const prev = { "cq-a": "alpha", "cq-b": "beta" };
  const nextPatchOnlyB = { ...prev, "cq-b": "beta-2" };
  assert.deepEqual(getChangedCounselorConsentQuestionIds(QUESTIONS, prev, nextPatchOnlyB), [
    "cq-b",
  ]);
  assert.deepEqual(
    getChangedCounselorConsentQuestionIds(QUESTIONS, prev, { ...prev, "partner-q": "x" }),
    [],
  );
}

function testSequentialPatchesPreserveBothAnswers() {
  let stored: Record<string, unknown> = {};
  const apply = (patch: Record<string, unknown>) => {
    const previous = { ...stored };
    stored = { ...stored, ...patch };
    getChangedCounselorConsentQuestionIds(QUESTIONS, previous, stored);
  };
  apply({ "cq-a": "first" });
  apply({ "cq-b": "second" });
  assert.deepEqual(stored, { "cq-a": "first", "cq-b": "second" });
}

async function testJsonDraftPatchAndRevision() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-p2a-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage.json");
  delete process.env.DATABASE_URL;

  const store = await import("../src/lib/stores/marriage-counseling-json");

  await store.saveCounselorSharingConsent({
    journeyId: "j1",
    moduleId: "mod1",
    questionId: "cq-a",
    userId: "u1",
    granted: false,
    counselorDisclosureGranted: true,
    updatedAt: new Date().toISOString(),
    consentedCounselorUserId: "c1",
    generationAtGrant: 0,
    answerFingerprint: "a".repeat(64),
    grantedAt: new Date().toISOString(),
  });
  await store.saveCounselorSharingConsent({
    journeyId: "j1",
    moduleId: "mod1",
    questionId: "cq-b",
    userId: "u1",
    granted: false,
    counselorDisclosureGranted: true,
    updatedAt: new Date().toISOString(),
    consentedCounselorUserId: "c1",
    generationAtGrant: 0,
    answerFingerprint: "b".repeat(64),
    grantedAt: new Date().toISOString(),
  });
  await store.savePartnerSharingConsent({
    journeyId: "j1",
    moduleId: "mod1",
    questionId: "partner-q",
    userId: "u1",
    granted: true,
    updatedAt: new Date().toISOString(),
  });

  const base = {
    journeyId: "j1",
    moduleId: "mod1",
    userId: "u1",
    contentVersion: "v1",
    questions: QUESTIONS,
  };

  await store.applyAssessmentDraftPatch({
    ...base,
    patch: { "cq-a": "v1" },
    lastSavedAt: "t1",
  });
  await store.applyAssessmentDraftPatch({
    ...base,
    patch: { "cq-b": "v2" },
    lastSavedAt: "t2",
  });

  const response = await store.getResponse("j1", "mod1", "u1");
  assert.deepEqual(response?.answers, { "cq-a": "v1", "cq-b": "v2" });

  const consentsAfterDraft = await store.listSharingConsents("j1", "mod1");
  assert.equal(consentsAfterDraft.find((c) => c.questionId === "cq-a")?.counselorDisclosureGranted, false);
  assert.equal(consentsAfterDraft.find((c) => c.questionId === "cq-b")?.counselorDisclosureGranted, false);
  assert.equal(consentsAfterDraft.find((c) => c.questionId === "partner-q")?.granted, true);

  await store.saveCounselorSharingConsent({
    journeyId: "j1",
    moduleId: "mod1",
    questionId: "cq-a",
    userId: "u1",
    granted: false,
    counselorDisclosureGranted: true,
    updatedAt: new Date().toISOString(),
    consentedCounselorUserId: "c1",
    generationAtGrant: 1,
    answerFingerprint: "c".repeat(64),
    grantedAt: new Date().toISOString(),
  });

  await store.applyAssessmentDraftPatch({
    ...base,
    patch: { "cq-a": "v1-revert" },
    lastSavedAt: "t3",
  });
  await store.applyAssessmentDraftPatch({
    ...base,
    patch: { "cq-a": "v1" },
    lastSavedAt: "t4",
  });
  const genAfterRevert = await store.getAnswerChangeGeneration("j1", "mod1", "cq-a", "u1");
  assert.ok(genAfterRevert >= 3);
  assert.equal(
    (await store.listSharingConsents("j1", "mod1")).find((c) => c.questionId === "cq-a")
      ?.counselorDisclosureGranted,
    false,
  );

  await store.saveResponse({
    id: response!.id,
    journeyId: "j1",
    moduleId: "mod1",
    contentVersion: "v1",
    userId: "u1",
    status: "submitted",
    answers: response!.answers,
    lastSavedAt: "t5",
    submittedAt: "t5",
    revisionGeneration: 0,
  });

  const rev = await store.createRevisionRequest({
    id: "rev1",
    journeyId: "j1",
    moduleId: "mod1",
    userId: "u1",
    status: "pending",
    requestedAt: "t6",
  });

  await store.saveCounselorSharingConsent({
    journeyId: "j1",
    moduleId: "mod1",
    questionId: "cq-b",
    userId: "u1",
    granted: false,
    counselorDisclosureGranted: true,
    updatedAt: new Date().toISOString(),
    consentedCounselorUserId: "c1",
    generationAtGrant: 1,
    answerFingerprint: "d".repeat(64),
    grantedAt: new Date().toISOString(),
  });

  const counselorQids = listCounselorWithConsentQuestionIds(QUESTIONS);
  const genBeforeApprove = await store.getAnswerChangeGeneration("j1", "mod1", "cq-b", "u1");

  const first = await store.approveAssessmentRevisionRequest(rev.id, "c1", counselorQids);
  assert.equal(first.idempotent, false);
  const reopened = await store.getResponse("j1", "mod1", "u1");
  assert.equal(reopened?.status, "draft");
  assert.equal(reopened?.revisionGeneration, 1);
  assert.equal(
    (await store.listSharingConsents("j1", "mod1")).find((c) => c.questionId === "cq-b")
      ?.counselorDisclosureGranted,
    false,
  );
  const genAfterApprove = await store.getAnswerChangeGeneration("j1", "mod1", "cq-b", "u1");
  assert.equal(genAfterApprove, genBeforeApprove + 1);

  const second = await store.approveAssessmentRevisionRequest(rev.id, "c1", counselorQids);
  assert.equal(second.idempotent, true);
  const afterSecondApprove = await store.getResponse("j1", "mod1", "u1");
  assert.equal(afterSecondApprove?.revisionGeneration, 1);

  const revDenied = await store.createRevisionRequest({
    id: "rev2",
    journeyId: "j1",
    moduleId: "mod1",
    userId: "u1",
    status: "pending",
    requestedAt: "t7",
  });
  await store.saveCounselorSharingConsent({
    journeyId: "j1",
    moduleId: "mod1",
    questionId: "cq-a",
    userId: "u1",
    granted: false,
    counselorDisclosureGranted: true,
    updatedAt: new Date().toISOString(),
    consentedCounselorUserId: "c1",
    generationAtGrant: genAfterRevert,
    answerFingerprint: "e".repeat(64),
    grantedAt: new Date().toISOString(),
  });
  const genBeforeDeny = await store.getAnswerChangeGeneration("j1", "mod1", "cq-a", "u1");
  await store.updateRevisionRequest(revDenied.id, {
    status: "denied",
    resolvedAt: "t8",
    resolvedBy: "c1",
  });
  const genAfterDeny = await store.getAnswerChangeGeneration("j1", "mod1", "cq-a", "u1");
  assert.equal(genAfterDeny, genBeforeDeny);
  assert.equal(
    (await store.listSharingConsents("j1", "mod1")).find((c) => c.questionId === "cq-a")
      ?.counselorDisclosureGranted,
    true,
  );

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

async function main() {
  testChangedQuestionDetection();
  testSequentialPatchesPreserveBothAnswers();
  await testJsonDraftPatchAndRevision();
  console.log("marriage-phase2a-concurrency.test.ts: OK");
  console.log(
    "NOTE: Postgres pg_advisory_xact_lock + FOR UPDATE serialization is UNVERIFIED without isolated DB tests.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
