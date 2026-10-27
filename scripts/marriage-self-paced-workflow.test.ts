/**
 * Self-paced counseling workflow (isolated JSON store).
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-sp-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage-counseling.json");
  process.env.MARRIAGE_CURRICULUM_DATA_FILE = join(dir, "marriage-curriculum.json");
  process.env.MARRIAGE_SELF_PACED_DATA_FILE = join(dir, "marriage-self-paced.json");
  process.env.MARRIAGE_COUNSELOR_USER_IDS = "counselor-1";
  delete process.env.DATABASE_URL;

  const { marriageStore } = await import("../src/lib/stores/marriage-counseling-store");
  const store = marriageStore();

  const journey = await store.createJourney({
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: null,
    counselorUserId: "counselor-1",
    createdBy: "user-a",
    participantAId: "user-a",
    participantBId: "user-b",
    pairingMode: "journey_invite",
  });
  await store.updateJourney(journey.id, { counselingDeliveryMode: "SELF_PACED" });

  const counselor = { id: "counselor-1", name: "Counselor", email: "c@test", role: "member" as const };
  const partnerA = { id: "user-a", name: "A", email: "a@test", role: "member" as const };
  const partnerB = { id: "user-b", name: "B", email: "b@test", role: "member" as const };

  const {
    counselorAssignSelfPacedSession,
    syncSelfPacedReviewsAfterModuleSubmit,
    saveCounselorFeedbackDraft,
    publishCounselorSessionFeedback,
    approveSelfPacedSession,
    assertPremaritalCompletionAllowed,
  } = await import("../src/lib/marriage-self-paced-server");

  const sessionKey = "session-1-foundations";
  const moduleId = "mod-06-faith";

  let review = await counselorAssignSelfPacedSession(counselor, journey.id, sessionKey, [moduleId]);
  assert.equal(review.workflowStatus, "awaiting_partners");

  const baseResponse = {
    journeyId: journey.id,
    moduleId,
    contentVersion: "v1",
    answers: {},
    lastSavedAt: new Date().toISOString(),
    revisionGeneration: 0,
  };
  await store.saveResponse({
    ...baseResponse,
    id: "r-a",
    userId: "user-a",
    status: "submitted",
    submittedAt: new Date().toISOString(),
  });
  await syncSelfPacedReviewsAfterModuleSubmit(journey.id, moduleId);
  review = (await store.getSelfPacedSessionReview(journey.id, sessionKey))!;
  assert.equal(review.workflowStatus, "awaiting_partners");

  await store.saveResponse({
    ...baseResponse,
    id: "r-b",
    userId: "user-b",
    status: "submitted",
    submittedAt: new Date().toISOString(),
  });
  await syncSelfPacedReviewsAfterModuleSubmit(journey.id, moduleId);
  review = (await store.getSelfPacedSessionReview(journey.id, sessionKey))!;
  assert.equal(review.workflowStatus, "ready_for_review");

  await assertPremaritalCompletionAllowed(counselor, journey.id, sessionKey, "completed").then(
    () => {
      throw new Error("expected block");
    },
    () => {},
  );

  await saveCounselorFeedbackDraft(counselor, journey.id, sessionKey, {
    sharedFeedback: "Great start.",
    counselorInternalNotes: "Private note",
  });
  await publishCounselorSessionFeedback(counselor, journey.id, sessionKey);
  await approveSelfPacedSession(counselor, journey.id, sessionKey);

  const row = (await store.listPremaritalProgramSessionsForJourney(journey.id)).find(
    (s) => s.sessionKey === sessionKey,
  );
  assert.equal(row?.status, "completed");

  const published = await (
    await import("../src/lib/marriage-self-paced-server")
  ).partnerViewPublishedFeedback(partnerA, journey.id, sessionKey);
  assert.ok(published?.sharedFeedback?.includes("Great start"));
  assert.equal(published?.partnerSpecific, null);

  rmSync(dir, { recursive: true, force: true });
  console.log("marriage-self-paced-workflow.test.ts: PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
