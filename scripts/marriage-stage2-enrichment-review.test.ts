import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-s2-enrich-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage-counseling.json");
  process.env.MARRIAGE_CURRICULUM_DATA_FILE = join(dir, "marriage-curriculum.json");
  process.env.MARRIAGE_SELF_PACED_DATA_FILE = join(dir, "marriage-self-paced.json");
  process.env.MARRIAGE_COUNSELOR_USER_IDS = "counselor-1";
  delete process.env.DATABASE_URL;

  const { marriageStore } = await import("../src/lib/stores/marriage-counseling-store");
  const store = marriageStore();
  const journey = await store.createJourney({
    coupleLinkId: "",
    programType: "enrichment",
    status: "active",
    currentModuleId: null,
    counselorUserId: "counselor-1",
    createdBy: "user-a",
    participantAId: "user-a",
    participantBId: "user-b",
    pairingMode: "journey_invite",
  });

  const counselor = { id: "counselor-1", name: "C", email: "c@test", role: "member" as const };
  const moduleId = "s2-mod-07-faith-values";
  const { counselorAssignStage2EnrichmentReview } = await import(
    "../src/lib/marriage-session-review-workspace"
  );
  const { stage2EnrichmentSessionKey, isStage2EnrichmentSessionKey } = await import(
    "../src/lib/marriage-enrichment-session-keys"
  );
  const sessionKey = stage2EnrichmentSessionKey(moduleId);
  assert.ok(isStage2EnrichmentSessionKey(sessionKey));

  await counselorAssignStage2EnrichmentReview(counselor, journey.id, moduleId);
  const review = await store.getSelfPacedSessionReview(journey.id, sessionKey);
  assert.ok(review);
  assert.deepEqual(review!.assignedModuleIds, [moduleId]);

  const premaritalBefore = await store.listPremaritalProgramSessionsForJourney(journey.id);
  const completedBefore = premaritalBefore.filter((s) => s.status === "completed").length;

  const {
    saveCounselorFeedbackDraft,
    publishCounselorSessionFeedback,
    approveSelfPacedSession,
  } = await import("../src/lib/marriage-self-paced-server");

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
    id: "ra",
    userId: "user-a",
    status: "submitted",
    submittedAt: new Date().toISOString(),
  });
  await store.saveResponse({
    ...baseResponse,
    id: "rb",
    userId: "user-b",
    status: "submitted",
    submittedAt: new Date().toISOString(),
  });

  await saveCounselorFeedbackDraft(counselor, journey.id, sessionKey, {
    sharedFeedback: "Enrichment guidance",
  });
  await publishCounselorSessionFeedback(counselor, journey.id, sessionKey);
  await approveSelfPacedSession(counselor, journey.id, sessionKey);

  const premaritalAfter = await store.listPremaritalProgramSessionsForJourney(journey.id);
  const completedAfter = premaritalAfter.filter((s) => s.status === "completed").length;
  assert.equal(completedAfter, completedBefore, "Stage 2 approval must not increment premarital session completion");

  rmSync(dir, { recursive: true, force: true });
  console.log("marriage-stage2-enrichment-review.test.ts: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
