import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-mode-"));
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

  const partnerA = { id: "user-a", name: "A", email: "a@test", role: "member" as const };
  const { recordMarriageConsent } = await import("../src/lib/marriage-counseling-server");
  await recordMarriageConsent(partnerA, journey.id);
  const outsider = { id: "user-x", name: "X", email: "x@test", role: "member" as const };

  const { setCoupleCounselingDeliveryMode } = await import("../src/lib/marriage-self-paced-server");

  const updated = await setCoupleCounselingDeliveryMode(partnerA, journey.id, "SELF_PACED");
  assert.equal(updated.counselingDeliveryMode, "SELF_PACED");

  let denied = false;
  try {
    await setCoupleCounselingDeliveryMode(outsider, journey.id, "VIRTUAL");
  } catch {
    denied = true;
  }
  assert.ok(denied, "outsider cannot change mode");

  rmSync(dir, { recursive: true, force: true });
  console.log("marriage-counseling-mode.test.ts: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
