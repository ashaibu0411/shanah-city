/**
 * Session-linked homework must match sessionKey for self-paced session approval gates.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-hw-link-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage-counseling.json");
  process.env.MARRIAGE_CURRICULUM_DATA_FILE = join(dir, "marriage-curriculum.json");
  process.env.MARRIAGE_SELF_PACED_DATA_FILE = join(dir, "marriage-self-paced.json");
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
  await store.updateJourney(journey.id, { counselingDeliveryMode: "SELF_PACED" });

  const counselor = { id: "counselor-1", name: "C", email: "c@test", role: "member" as const };
  const { createSessionHomeworkDraft, releaseSessionHomework } = await import("../src/lib/marriage-homework-server");

  const sessionKey = "session-1-foundations";
  const unlinked = await createSessionHomeworkDraft(counselor, {
    journeyId: journey.id,
    title: "Unlinked",
    activities: [
      {
        id: "a1",
        kind: "individual_writing",
        title: "T",
        questions: [{ id: "q1", prompt: "Q", responseKind: "long_text", visibility: "private" }],
      },
    ],
  });
  let releaseBlocked = false;
  try {
    await releaseSessionHomework(counselor, unlinked.id);
  } catch (e) {
    releaseBlocked = e instanceof Error && e.message.includes("sessionKey");
  }
  assert.ok(releaseBlocked, "release must require sessionId in self-paced mode");

  const linked = await createSessionHomeworkDraft(counselor, {
    journeyId: journey.id,
    title: "Linked",
    sessionId: sessionKey,
    activities: unlinked.activities,
  });
  const released = await releaseSessionHomework(counselor, linked.id);
  assert.equal(released.sessionId, sessionKey);
  assert.equal(released.status, "released");

  rmSync(dir, { recursive: true, force: true });
  console.log("marriage-homework-session-link.test.ts: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
