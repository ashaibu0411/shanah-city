import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-fb-"));
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

  const counselor = { id: "counselor-1", name: "C", email: "c@test", role: "member" as const };
  const partnerA = { id: "user-a", name: "A", email: "a@test", role: "member" as const };
  const sessionKey = "session-1-foundations";

  const { counselorAssignSelfPacedSession, publishCounselorSessionFeedback, saveCounselorFeedbackDraft } =
    await import("../src/lib/marriage-self-paced-server");
  await counselorAssignSelfPacedSession(counselor, journey.id, sessionKey, ["mod-06-faith"]);
  await saveCounselorFeedbackDraft(counselor, journey.id, sessionKey, {
    sharedFeedback: "Shared word",
    partnerSpecific: { "user-a": "Only for A", "user-b": "Only for B" },
    counselorInternalNotes: "Secret",
  });
  await publishCounselorSessionFeedback(counselor, journey.id, sessionKey);

  const { buildCoupleFeedbackCenterView, getCoupleSessionFeedbackDetail } = await import(
    "../src/lib/marriage-couple-feedback-server"
  );
  const center = await buildCoupleFeedbackCenterView(partnerA, journey);
  assert.ok(center.sessions.some((s) => s.sessionKey === sessionKey));

  const detail = await getCoupleSessionFeedbackDetail(partnerA, journey, sessionKey);
  assert.ok(detail.feedback?.sharedFeedback?.includes("Shared"));
  assert.ok(detail.feedback?.partnerSpecific?.includes("Only for A"));
  assert.equal((detail.feedback as { counselorInternalNotes?: string })?.counselorInternalNotes, undefined);

  await new Promise((r) => setTimeout(r, 50));
  rmSync(dir, { recursive: true, force: true });
  console.log("marriage-couple-feedback-center.test.ts: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
