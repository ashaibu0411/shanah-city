/**
 * Phase 2B security corrections — JSON store + serialized DTO tests (no database).
 * Run: npx.cmd tsx scripts/marriage-phase2b-security-corrections.test.ts
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PublicMember } from "../src/lib/auth-types";
import {
  computeAnswerFingerprint,
  verifyCounselorAnswerDisclosure,
} from "../src/lib/marriage-counselor-consent";
import {
  counselorRouteErrorBody,
  MARRIAGE_COUNSELOR_ACCESS_DENIED,
} from "../src/lib/marriage-counselor-api-security";
import { buildMarriageCounselorAdministrativeOverview } from "../src/lib/marriage-counselor-admin-overview";
import { buildCounselorAuthorizedAnswerViews } from "../src/lib/marriage-counselor-clinical-detail";
import { getCounselorJourneyDetail, updateCounselingSession } from "../src/lib/marriage-counseling-counselor-server";
import { buildComparisonItemsWithConsent } from "../src/lib/marriage-stage2-activity-engine";
import type { MarriageQuestionDefinition } from "../src/lib/marriage-counseling-types";

function member(id: string): PublicMember {
  return { id, name: id, email: `${id}@test.local`, role: "member" } as PublicMember;
}

const ADMIN_FORBIDDEN_KEYS = [
  "moduleProgress",
  "bothSubmitted",
  "awaitingBoth",
  "authorizedAnswers",
  "comparisonSummaries",
  "answersJson",
  '"answers"',
  "zoomUrl",
  "notes",
];

function assertAdminDtoClean(payload: unknown) {
  const json = JSON.stringify(payload);
  for (const key of ADMIN_FORBIDDEN_KEYS) {
    assert.ok(!json.includes(key), `admin leak: ${key}`);
  }
  const obj = payload as Record<string, unknown>;
  assert.equal(obj.access, "administrative");
  assert.ok(typeof obj.moduleCount === "number");
  assert.ok(typeof obj.completedModules === "number");
}

async function testSessionOwnership() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-p2b-sec-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage.json");
  delete process.env.DATABASE_URL;
  process.env.MARRIAGE_COUNSELOR_USER_IDS = "c-old,c-new";

  const jsonStore = await import("../src/lib/stores/marriage-counseling-json");
  const journey = await jsonStore.createJourney({
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: null,
    counselorUserId: "c-old",
    createdBy: "u-a",
    participantAId: "u-a",
    participantBId: "u-b",
  });

  await jsonStore.saveSession({
    id: "sess-1",
    journeyId: journey.id,
    scheduledAt: new Date().toISOString(),
    topic: "Prior counselor",
    notes: "CONFIDENTIAL-NOTES",
    status: "scheduled",
    createdBy: "c-old",
    createdAt: new Date().toISOString(),
  });

  const ownUpdate = await updateCounselingSession(member("c-old"), "sess-1", {
    topic: "Updated by owner",
  });
  assert.equal(ownUpdate.notes, "CONFIDENTIAL-NOTES");
  assert.equal(ownUpdate.topic, "Updated by owner");

  await jsonStore.applyCounselorJourneyAccessChange(journey.id, { counselorUserId: "c-new" });

  await assert.rejects(
    () => updateCounselingSession(member("c-new"), "sess-1", { topic: "Hijack" }),
    (err: Error) => {
      assert.equal(err.message, MARRIAGE_COUNSELOR_ACCESS_DENIED);
      return true;
    },
  );

  await assert.rejects(
    () => updateCounselingSession(member("c-new"), "missing-session", { topic: "Guess" }),
    (err: Error) => {
      assert.equal(err.message, MARRIAGE_COUNSELOR_ACCESS_DENIED);
      return true;
    },
  );

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

async function testAdminVsClinicalJourneyDetail() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-p2b-sec2-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage.json");
  delete process.env.DATABASE_URL;
  process.env.MARRIAGE_COUNSELOR_USER_IDS = "pastor-view,c-assigned";

  const jsonStore = await import("../src/lib/stores/marriage-counseling-json");
  const journey = await jsonStore.createJourney({
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: null,
    counselorUserId: "c-assigned",
    createdBy: "u-a",
    participantAId: "u-a",
    participantBId: "u-b",
  });

  await assert.rejects(
    () => getCounselorJourneyDetail(member("pastor-view"), journey.id),
    (err: Error) => {
      assert.equal(err.message, MARRIAGE_COUNSELOR_ACCESS_DENIED);
      return true;
    },
  );

  const clinicalView = await getCounselorJourneyDetail(member("c-assigned"), journey.id);
  assert.equal(clinicalView.access, "clinical");

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

async function testWithheldAnswerSerialization() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-p2b-sec3-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage.json");
  delete process.env.DATABASE_URL;
  process.env.MARRIAGE_COUNSELOR_USER_IDS = "c1";

  const jsonStore = await import("../src/lib/stores/marriage-counseling-json");
  const journey = await jsonStore.createJourney({
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: null,
    counselorUserId: "c1",
    createdBy: "u-a",
    participantAId: "u-a",
    guidedModuleIds: ["mod-02-family-background"],
  });

  const modId = "mod-02-family-background";
  const questionId = "fb-sensitive";
  await jsonStore.saveResponse({
    id: "resp-1",
    journeyId: journey.id,
    moduleId: modId,
    contentVersion: "v1",
    userId: "u-a",
    status: "submitted",
    answers: { [questionId]: "secret-answer" },
    lastSavedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  });

  await jsonStore.saveCounselorSharingConsent({
    journeyId: journey.id,
    moduleId: modId,
    questionId,
    userId: "u-a",
    granted: false,
    counselorDisclosureGranted: true,
    updatedAt: new Date().toISOString(),
    consentedCounselorUserId: "c1",
    generationAtGrant: 0,
    answerFingerprint: computeAnswerFingerprint("wrong"),
    grantedAt: new Date().toISOString(),
  });

  const views = await buildCounselorAuthorizedAnswerViews(member("c1"), journey);
  const row = views.find((v) => v.questionId === questionId);
  assert.ok(row);
  assert.equal(row.withheld, true);
  assert.equal("answer" in (row as object), false);

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

function testStage2SharingUnchanged() {
  const q = (id: string, visibility: MarriageQuestionDefinition["visibility"]) =>
    ({
      id,
      moduleId: "m",
      prompt: id,
      type: "short_answer",
      required: false,
      visibility,
    }) as MarriageQuestionDefinition;

  const items = buildComparisonItemsWithConsent(
    [q("shared", "shared_after_both_submit"), q("explicit", "explicit_consent_to_share")],
    { shared: "a", explicit: "x" },
    { shared: "b", explicit: "y" },
    "u-a",
    "u-b",
    "j",
    "m",
    [],
  );
  assert.deepEqual(items.map((i) => i.questionId), ["shared"]);
}

function testFingerprintAllowsWhenValid() {
  const fp = computeAnswerFingerprint("allowed-text");
  assert.ok(
    verifyCounselorAnswerDisclosure({
      consent: {
        journeyId: "j",
        moduleId: "m",
        questionId: "q",
        userId: "u",
        granted: false,
        counselorDisclosureGranted: true,
        updatedAt: "",
        consentedCounselorUserId: "c1",
        generationAtGrant: 0,
        answerFingerprint: fp,
        grantedAt: "",
      },
      currentGeneration: 0,
      assignedCounselorUserId: "c1",
      viewerCounselorUserId: "c1",
      currentAnswer: "allowed-text",
    }).allowed,
  );
}

async function testAdministrativeOverviewAggregate() {
  process.env.MARRIAGE_COUNSELOR_USER_IDS = "pastor";
  const overview = await buildMarriageCounselorAdministrativeOverview(member("pastor"), {
    id: "j",
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: null,
    counselorUserId: "c-other",
    createdBy: "u",
    createdAt: "",
    updatedAt: "",
    participantAId: "u-a",
  });
  assertAdminDtoClean(overview);
}

function testRouteErrorSanitization() {
  assert.deepEqual(counselorRouteErrorBody(MARRIAGE_COUNSELOR_ACCESS_DENIED), {
    error: MARRIAGE_COUNSELOR_ACCESS_DENIED,
  });
  assert.deepEqual(counselorRouteErrorBody("Counselor access has been revoked for this journey."), {
    error: MARRIAGE_COUNSELOR_ACCESS_DENIED,
  });
  const body = counselorRouteErrorBody("Unknown action.");
  assert.equal(body.error, "Unknown action.");
  assert.equal(JSON.stringify(body).includes("CONFIDENTIAL"), false);
}

async function main() {
  testRouteErrorSanitization();
  testFingerprintAllowsWhenValid();
  testStage2SharingUnchanged();
  await testAdministrativeOverviewAggregate();
  await testSessionOwnership();
  await testAdminVsClinicalJourneyDetail();
  await testWithheldAnswerSerialization();
  console.log("marriage-phase2b-security-corrections.test.ts: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
