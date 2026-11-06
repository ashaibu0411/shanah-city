/**
 * Homework counselor review lifecycle (JSON store).
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-hw-rev-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage-counseling.json");
  process.env.MARRIAGE_CURRICULUM_DATA_FILE = join(dir, "marriage-curriculum.json");
  process.env.MARRIAGE_COUNSELOR_USER_IDS = "counselor-1";
  for (const key of ["DATABASE_URL", "DIRECT_URL", "DIRECT_DATABASE_URL"]) delete process.env[key];

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

  const counselor = { id: "counselor-1", name: "Counselor", email: "c@test", role: "member" as const };
  const partnerA = { id: "user-a", name: "A", email: "a@test", role: "member" as const };

  const { createSessionHomeworkDraft, releaseSessionHomework } = await import(
    "../src/lib/marriage-homework-server"
  );
  const hw = await createSessionHomeworkDraft(counselor, {
    journeyId: journey.id,
    title: "Test HW",
    activities: [
      {
        id: "act1",
        kind: "individual_writing",
        title: "Write",
        questions: [{ id: "q1", prompt: "One", responseKind: "long_text", visibility: "private" }],
      },
    ],
  });
  await releaseSessionHomework(counselor, hw.id);

  const key = "act1:q1";
  const { saveParticipantHomeworkDraft, submitParticipantHomework, counselorRequestHomeworkRevision, counselorApproveHomeworkSubmission } =
    await import("../src/lib/marriage-homework-server");

  await saveParticipantHomeworkDraft(partnerA, hw.id, { [key]: "Answer one" });
  const sub = await submitParticipantHomework(partnerA, hw.id);
  assert.equal(sub.reviewStatus, "submitted");

  await counselorRequestHomeworkRevision(counselor, hw.id, "user-a", "Please expand your answer.");
  const mid = await store.getSessionHomeworkResponse(hw.id, "user-a");
  assert.equal(mid?.reviewStatus, "revision_requested");

  await saveParticipantHomeworkDraft(partnerA, hw.id, { [key]: "Answer one revised" });
  const resub = await submitParticipantHomework(partnerA, hw.id);
  assert.equal(resub.reviewStatus, "resubmitted");

  await counselorApproveHomeworkSubmission(counselor, hw.id, "user-a");
  const approved = await store.getSessionHomeworkResponse(hw.id, "user-a");
  assert.equal(approved?.reviewStatus, "approved");

  await new Promise((r) => setTimeout(r, 150));
  rmSync(dir, { recursive: true, force: true });
  console.log("marriage-homework-review-lifecycle.test.ts: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
