/**
 * Regression: hub + premarital views reflect submitted assessments and homework.
 * Run: npm run test:marriage:hub-submission-status
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  MARRIAGE_CONSENT_VERSION,
  MARRIAGE_COUNSELING_CONTENT_VERSION,
} from "../src/lib/marriage-counseling-curriculum";
import { WEEK_1_HOMEWORK_TEMPLATE_KEY } from "../src/lib/marriage-homework-templates";
import { cloneTemplateActivities } from "../src/lib/marriage-homework-templates";
import { homeworkIsCompleteForSubmit } from "../src/lib/marriage-homework-status";
import { homeworkAnswerKey } from "../src/lib/marriage-homework-types";
import type { MarriageHomeworkActivityDef } from "../src/lib/marriage-homework-types";
import {
  hubModuleStatusFromResponse,
  isAssessmentSubmitted,
} from "../src/lib/marriage-assessment-participant-status";

const MOD_06_FAITH_ANSWERS: Record<string, string> = {
  "faith-prayer": "agree",
  "faith-church": "Weekly worship together",
  "faith-growth": "devotion",
  "faith-giving": "agree",
  "faith-lead": "Prayer and shared leadership in Christ",
};

function writableHomeworkAnswers(activities: MarriageHomeworkActivityDef[]): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const act of activities) {
    if (act.kind === "curriculum_link") continue;
    for (const q of act.questions) {
      answers[homeworkAnswerKey(act.id, q.id)] = "Thoughtful reflection for regression test.";
    }
  }
  return answers;
}

async function withJsonStore<T>(fn: () => Promise<T>): Promise<T> {
  const dir = mkdtempSync(join(tmpdir(), "marriage-hub-submit-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage-counseling.json");
  process.env.MARRIAGE_CURRICULUM_DATA_FILE = join(dir, "marriage-curriculum.json");
  process.env.MARRIAGE_SESSION_HOMEWORK_DATA_FILE = join(dir, "marriage-session-homework.json");
  delete process.env.DATABASE_URL;
  process.env.NEXT_PUBLIC_MARRIAGE_STAGE2 = "0";
  process.env.MARRIAGE_HUB_STAGE2_ENABLED = "0";

  try {
    return await fn();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

assert.equal(
  hubModuleStatusFromResponse({ status: "draft", submittedAt: "2026-01-01T00:00:00.000Z" }),
  "submitted",
  "legacy submittedAt without status=submitted counts as submitted",
);
assert.ok(isAssessmentSubmitted({ status: "draft", submittedAt: "2026-01-01T00:00:00.000Z" }));

async function main() {
await withJsonStore(async () => {
  const store = await import("../src/lib/stores/marriage-counseling-json");
  const homeworkStore = await import("../src/lib/stores/marriage-session-homework-json");
  const { getMarriageHubSummary, submitAssessment } = await import(
    "../src/lib/marriage-counseling-server"
  );
  const { buildCouplePremaritalProgramView } = await import(
    "../src/lib/marriage-premarital-program-server"
  );
  const { submitParticipantHomework } = await import("../src/lib/marriage-homework-server");

  const viewerA = { id: "user-s1-a", name: "A", email: "a@test.local" };
  const viewerB = { id: "user-s1-b", name: "B", email: "b@test.local" };
  const moduleId = "mod-06-faith";

  const journey = await store.createJourney({
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: moduleId,
    counselorUserId: null,
    createdBy: viewerA.id,
    pairingMode: "journey_invite",
    participantAId: viewerA.id,
    participantBId: viewerB.id,
    curriculumVersion: MARRIAGE_COUNSELING_CONTENT_VERSION,
  });

  for (const u of [viewerA, viewerB]) {
    await store.upsertConsent({
      journeyId: journey.id,
      userId: u.id,
      consentVersion: MARRIAGE_CONSENT_VERSION,
      consentedAt: new Date().toISOString(),
    });
  }

  const now = new Date().toISOString();
  await store.saveResponse({
    id: "resp-a-faith",
    journeyId: journey.id,
    moduleId,
    contentVersion: MARRIAGE_COUNSELING_CONTENT_VERSION,
    userId: viewerA.id,
    status: "draft",
    answers: { "faith-prayer": "Agree" },
    lastSavedAt: now,
    submittedAt: now,
    revisionGeneration: 0,
  });

  let hub = await getMarriageHubSummary(viewerA);
  const modRow = hub.modules.find((m) => m.moduleId === moduleId);
  assert.equal(modRow?.myStatus, "submitted", "hub must honor submittedAt for Session 1 module");

  await assert.rejects(
    () =>
      store.applyAssessmentDraftPatch({
        journeyId: journey.id,
        moduleId,
        userId: viewerA.id,
        contentVersion: MARRIAGE_COUNSELING_CONTENT_VERSION,
        patch: { "faith-church": "x" },
        questions: [],
        lastSavedAt: now,
      }),
    /submitted/,
    "draft patch must not clobber submitted work",
  );

  hub = await getMarriageHubSummary(viewerA);
  assert.equal(
    hub.modules.find((m) => m.moduleId === moduleId)?.myStatus,
    "submitted",
    "status unchanged after blocked patch",
  );

  const activities = cloneTemplateActivities(WEEK_1_HOMEWORK_TEMPLATE_KEY);
  const hwAnswers = writableHomeworkAnswers(activities);
  assert.ok(homeworkIsCompleteForSubmit(activities, hwAnswers), "fixture fills all writable prompts");

  const hw = await homeworkStore.saveSessionHomework({
    id: "hw-week1",
    journeyId: journey.id,
    counselorUserId: "counselor-1",
    title: "After Session 1 homework",
    instructions: "Reflect",
    status: "released",
    templateKey: WEEK_1_HOMEWORK_TEMPLATE_KEY,
    activities,
    createdAt: now,
    updatedAt: now,
  });

  await homeworkStore.saveSessionHomeworkResponse({
    homeworkId: hw.id,
    userId: viewerA.id,
    answers: hwAnswers,
    lastSavedAt: now,
  });
  await submitParticipantHomework(viewerA, hw.id);

  hub = await getMarriageHubSummary(viewerA);
  const hwView = hub.sessionHomework?.find((h) => h.id === hw.id);
  assert.equal(hwView?.status, "submitted", "homework list shows submitted after submit");

  const program = await buildCouplePremaritalProgramView(viewerA, journey);
  assert.ok(program, "premarital program for joined couple");
  const session1 = program!.sessions.find((s) => s.sessionKey === "session-1-foundations");
  assert.equal(session1?.status, "not_started", "counselor session completion stays separate");
  assert.equal(
    session1?.courseworkStatus,
    "waiting_partner",
    "self-paced participant sees submitted work while partner is pending, not session Not started",
  );
  assert.equal(program!.courseworkSubmittedCount, 1, "own completed coursework counts without counselor appointment");
  assert.equal(
    program!.currentCourseworkSessionKey,
    "session-2-knowing-yourself",
    "next self-paced lesson is not blocked by partner or counselor session marker",
  );
  const session1Hw = session1?.releasedHomework.find((h) => h.homeworkId === hw.id);
  assert.equal(session1Hw?.status, "submitted", "Session 1 homework row shows submitted");

  const partnerHub = await getMarriageHubSummary(viewerB);
  const partnerMod = partnerHub.modules.find((m) => m.moduleId === moduleId);
  assert.equal(partnerMod?.partnerStatus, "submitted", "partner sees other submitted module");
  assert.equal(partnerMod?.myStatus, "not_started", "partner own status unchanged");

  await store.saveResponse({
    id: "resp-b-faith",
    journeyId: journey.id,
    moduleId,
    contentVersion: MARRIAGE_COUNSELING_CONTENT_VERSION,
    userId: viewerB.id,
    status: "draft",
    answers: MOD_06_FAITH_ANSWERS,
    lastSavedAt: now,
    submittedAt: undefined,
    revisionGeneration: 0,
  });

  await submitAssessment(viewerB, moduleId);
  const afterB = await getMarriageHubSummary(viewerB);
  assert.equal(
    afterB.modules.find((m) => m.moduleId === moduleId)?.myStatus,
    "submitted",
    "submitAssessment path updates hub",
  );
  const afterBoth = await buildCouplePremaritalProgramView(viewerA, journey);
  const submittedSession1 = afterBoth?.sessions.find((session) => session.sessionKey === "session-1-foundations");
  assert.equal(
    submittedSession1?.courseworkStatus,
    "submitted",
    "self-paced learning status recognizes both required assessments and own submitted homework",
  );
  assert.equal(
    submittedSession1?.status,
    "not_started",
    "submissions never falsely mark the counselor-led session completed",
  );
  const partnerProgram = await buildCouplePremaritalProgramView(viewerB, journey);
  assert.equal(
    partnerProgram?.sessions.find((session) => session.sessionKey === "session-1-foundations")?.courseworkStatus,
    "in_progress",
    "partner has an independent homework state, even after submitting their own assessment",
  );
});

console.log("marriage-hub-submission-status.test.ts: OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
