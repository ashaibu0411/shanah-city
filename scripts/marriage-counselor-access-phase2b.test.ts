/**
 * Phase 2B counselor access enforcement (no database).
 * Run: npx.cmd tsx scripts/marriage-counselor-access-phase2b.test.ts
 */
import assert from "node:assert/strict";
import type { PublicMember } from "../src/lib/auth-types";
import {
  assertClinicalCounselorForJourney,
  viewerIsAssignedClinicalCounselor,
} from "../src/lib/marriage-counseling-access";
import type { MarriageCounselingJourneyRecord } from "../src/lib/marriage-counseling-types";
import { verifyCounselorAnswerDisclosure } from "../src/lib/marriage-counselor-consent";
import { counselorComparisonDisclosureEnabled } from "../src/lib/marriage-counselor-comparison-disclosure";
import { buildMarriageCounselorAdministrativeOverview } from "../src/lib/marriage-counselor-admin-overview";
import { isMarriageStage2Enabled } from "../src/lib/marriage-stage2-feature";

function member(id: string): PublicMember {
  return { id, name: id, email: `${id}@test.local`, role: "member" } as PublicMember;
}

function journey(partial: Partial<MarriageCounselingJourneyRecord> & { id: string }): MarriageCounselingJourneyRecord {
  return {
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: null,
    counselorUserId: "c-assigned",
    createdBy: "u1",
    createdAt: "2020-01-01T00:00:00.000Z",
    updatedAt: "2020-01-01T00:00:00.000Z",
    participantAId: "u-a",
    participantBId: "u-b",
    ...partial,
  };
}

const FORBIDDEN_SUBSTRINGS = [
  "answersJson",
  '"answers"',
  "myAnswer",
  "partnerAnswer",
  "private journal",
  "moduleProgress",
  "bothSubmitted",
  "authorizedAnswers",
  "comparisonSummaries",
  "attentionAreas",
  "zoomUrl",
];

function assertOverviewPayloadClean(payload: unknown) {
  const json = JSON.stringify(payload);
  for (const forbidden of FORBIDDEN_SUBSTRINGS) {
    assert.ok(!json.includes(forbidden), `admin overview leaked ${forbidden}`);
  }
}

async function testAssignmentGate() {
  process.env.MARRIAGE_COUNSELOR_USER_IDS = "c-assigned,other-counselor";
  const j = journey({ id: "j1", counselorUserId: "c-assigned" });
  assert.equal(viewerIsAssignedClinicalCounselor("c-assigned", j), true);
  assert.equal(viewerIsAssignedClinicalCounselor("other-counselor", j), false);
  await assert.rejects(
    () => assertClinicalCounselorForJourney(member("other-counselor"), j),
    /Access denied/,
  );
  await assertClinicalCounselorForJourney(member("c-assigned"), j);
}

function testConsentDisclosureDenials() {
  const baseConsent = {
    journeyId: "j1",
    moduleId: "m1",
    questionId: "q1",
    userId: "u-a",
    granted: true,
    updatedAt: "",
    consentedCounselorUserId: "c-assigned",
    generationAtGrant: 0,
    answerFingerprint: "abc",
    grantedAt: "",
  };
  assert.equal(
    verifyCounselorAnswerDisclosure({
      consent: { ...baseConsent, granted: false },
      currentGeneration: 0,
      assignedCounselorUserId: "c-assigned",
      viewerCounselorUserId: "c-assigned",
      currentAnswer: "hello",
    }).allowed,
    false,
  );
  assert.equal(
    verifyCounselorAnswerDisclosure({
      consent: { ...baseConsent, generationAtGrant: null },
      currentGeneration: 0,
      assignedCounselorUserId: "c-assigned",
      viewerCounselorUserId: "c-assigned",
      currentAnswer: "hello",
    }).allowed,
    false,
  );
  assert.equal(
    verifyCounselorAnswerDisclosure({
      consent: baseConsent,
      currentGeneration: 1,
      assignedCounselorUserId: "c-assigned",
      viewerCounselorUserId: "c-assigned",
      currentAnswer: "hello",
    }).allowed,
    false,
  );
  assert.equal(
    verifyCounselorAnswerDisclosure({
      consent: { ...baseConsent, consentedCounselorUserId: "other" },
      currentGeneration: 0,
      assignedCounselorUserId: "c-assigned",
      viewerCounselorUserId: "c-assigned",
      currentAnswer: "hello",
    }).allowed,
    false,
  );
  assert.equal(
    verifyCounselorAnswerDisclosure({
      consent: baseConsent,
      currentGeneration: 0,
      assignedCounselorUserId: "c-assigned",
      viewerCounselorUserId: "other-counselor",
      currentAnswer: "hello",
    }).allowed,
    false,
  );
}

async function testAdministrativeOverviewDto() {
  process.env.MARRIAGE_COUNSELOR_USER_IDS = "pastor-c";
  const j = journey({ id: "j-overview", counselorUserId: "c-other" });
  const overview = await buildMarriageCounselorAdministrativeOverview(member("pastor-c"), j);
  assert.equal(overview.access, "administrative");
  assert.equal(overview.viewerHasClinicalAccess, false);
  assert.ok(overview.coupleNames.length >= 0);
  assertOverviewPayloadClean(overview);
}

async function testClinicalPostRejectedForUnassigned() {
  process.env.MARRIAGE_COUNSELOR_USER_IDS = "c1,c2";
  const j = journey({ id: "j2", counselorUserId: "c1" });
  await assert.rejects(
    () => assertClinicalCounselorForJourney(member("c2"), j),
    /Access denied/,
  );
}

async function main() {
  assert.equal(counselorComparisonDisclosureEnabled(), false);
  assert.equal(isMarriageStage2Enabled(), false);
  await testAssignmentGate();
  testConsentDisclosureDenials();
  await testAdministrativeOverviewDto();
  await testClinicalPostRejectedForUnassigned();
  console.log("marriage-counselor-access-phase2b.test.ts: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
