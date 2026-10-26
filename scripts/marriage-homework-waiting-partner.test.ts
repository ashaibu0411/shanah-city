/**
 * Waiting-partner homework list: individual released items only, no strict partner assert.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MARRIAGE_COUNSELING_CONTENT_VERSION } from "../src/lib/marriage-counseling-curriculum";
import {
  cloneTemplateActivities,
  WEEK_1_HOMEWORK_TEMPLATE_KEY,
} from "../src/lib/marriage-homework-templates";

async function withJsonStore<T>(fn: () => Promise<T>): Promise<T> {
  const dir = mkdtempSync(join(tmpdir(), "marriage-hw-wait-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage-counseling.json");
  process.env.MARRIAGE_CURRICULUM_DATA_FILE = join(dir, "marriage-curriculum.json");
  process.env.MARRIAGE_SESSION_HOMEWORK_DATA_FILE = join(dir, "marriage-session-homework.json");
  delete process.env.DATABASE_URL;
  try {
    return await fn();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function main() {
  await withJsonStore(async () => {
    const { marriageStore } = await import("../src/lib/stores/marriage-counseling-store");
    const store = marriageStore();
    const { listReleasedHomeworkForParticipant } = await import("../src/lib/marriage-homework-server");

    const viewerA = { id: "user-a", name: "A", email: "a@test.local" };
    const journey = await store.createJourney({
      coupleLinkId: "",
      programType: "premarital",
      status: "active",
      currentModuleId: "mod-01-knowing-yourself",
      counselorUserId: null,
      createdBy: viewerA.id,
      pairingMode: "journey_invite",
      participantAId: viewerA.id,
      participantBId: "",
      curriculumVersion: MARRIAGE_COUNSELING_CONTENT_VERSION,
    });

    const individualActs = cloneTemplateActivities(WEEK_1_HOMEWORK_TEMPLATE_KEY).filter(
      (a) => a.kind !== "joint_discussion",
    );
    const jointActs = cloneTemplateActivities(WEEK_1_HOMEWORK_TEMPLATE_KEY);
    assert.ok(jointActs.some((a) => a.kind === "joint_discussion"), "fixture includes joint activity");

    const now = new Date().toISOString();
    await store.saveSessionHomework({
      id: "hw-individual",
      journeyId: journey.id,
      counselorUserId: viewerA.id,
      templateKey: WEEK_1_HOMEWORK_TEMPLATE_KEY,
      title: "Individual only",
      instructions: "",
      status: "released",
      activities: individualActs,
      createdAt: now,
      updatedAt: now,
    });

    await store.saveSessionHomework({
      id: "hw-joint",
      journeyId: journey.id,
      counselorUserId: viewerA.id,
      templateKey: WEEK_1_HOMEWORK_TEMPLATE_KEY,
      title: "Joint required",
      instructions: "",
      status: "released",
      activities: jointActs,
      createdAt: now,
      updatedAt: now,
    });

    const items = await listReleasedHomeworkForParticipant(viewerA, journey.id);
    assert.equal(items.length, 1, "only individual homework before partner joins");
    assert.equal(items[0]?.id, "hw-individual");
  });

  console.log("marriage-homework-waiting-partner.test.ts: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
