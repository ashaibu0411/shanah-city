/**
 * Phase 2C spouse counselor consent (JSON store, no database).
 * Run: npx.cmd tsx scripts/marriage-counselor-consent-grant.test.ts
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PublicMember } from "../src/lib/auth-types";
import {
  grantCounselorAnswerConsent,
  listCounselorConsentStatusForModule,
  revokeCounselorAnswerConsent,
} from "../src/lib/marriage-counselor-consent-participant";
import { buildComparisonItemsWithConsent } from "../src/lib/marriage-stage2-activity-engine";
import type { MarriageQuestionDefinition } from "../src/lib/marriage-counseling-types";

function member(id: string): PublicMember {
  return { id, name: id, email: `${id}@test.local`, role: "member" } as PublicMember;
}

async function testGrantRevokeFlow() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-p2c-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage.json");
  delete process.env.DATABASE_URL;

  const jsonStore = await import("../src/lib/stores/marriage-counseling-json");
  const journey = await jsonStore.createJourney({
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: null,
    counselorUserId: "c1",
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
    answers: { [questionId]: "My private background note" },
    lastSavedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  });

  await assert.rejects(
    () => grantCounselorAnswerConsent(member("u-stranger"), journey.id, modId, questionId),
    /not part of this journey/,
  );

  const grant1 = await grantCounselorAnswerConsent(member("u-a"), journey.id, modId, questionId);
  assert.equal(grant1.ok, true);

  const status1 = await listCounselorConsentStatusForModule(member("u-a"), journey.id, modId);
  const item1 = status1.items.find((i) => i.questionId === questionId);
  assert.equal(item1?.state, "shared_with_counselor");

  const grant2 = await grantCounselorAnswerConsent(member("u-a"), journey.id, modId, questionId);
  assert.equal(grant2.idempotent, true);

  await revokeCounselorAnswerConsent(member("u-a"), journey.id, modId, questionId);
  const status2 = await listCounselorConsentStatusForModule(member("u-a"), journey.id, modId);
  assert.equal(status2.items.find((i) => i.questionId === questionId)?.state, "not_shared");

  await grantCounselorAnswerConsent(member("u-a"), journey.id, modId, questionId);
  await jsonStore.incrementAnswerChangeGeneration(journey.id, modId, questionId, "u-a");
  const status3 = await listCounselorConsentStatusForModule(member("u-a"), journey.id, modId);
  assert.equal(status3.items.find((i) => i.questionId === questionId)?.state, "withdrawn");

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
}

function testStage2PartnerSharingUnchanged() {
  const q = (id: string, visibility: MarriageQuestionDefinition["visibility"]) =>
    ({
      id,
      moduleId: "m",
      prompt: id,
      type: "short_answer",
      required: false,
      visibility,
    }) as MarriageQuestionDefinition;

  const none = buildComparisonItemsWithConsent(
    [q("shared", "shared_after_both_submit"), q("counselor", "counselor_with_consent")],
    { shared: "a", counselor: "c-secret" },
    { shared: "b", counselor: "c-secret2" },
    "u-a",
    "u-b",
    "j",
    "m",
    [],
  );
  assert.deepEqual(none.map((i) => i.questionId), ["shared"]);
}

async function main() {
  testStage2PartnerSharingUnchanged();
  await testGrantRevokeFlow();
  console.log("marriage-counselor-consent-grant.test.ts: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
