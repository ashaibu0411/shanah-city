/**
 * Server-side integration tests for marriage counseling store + privacy rules.
 * Run: npx tsx scripts/marriage-counseling-integration.ts
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildSharedComparisonItems } from "../src/lib/marriage-counseling-comparison-utils";
import { MARRIAGE_COUNSELING_CONTENT_VERSION } from "../src/lib/marriage-counseling-curriculum";

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-test-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage-counseling.json");
  process.env.MARRIAGE_CURRICULUM_DATA_FILE = join(dir, "marriage-curriculum.json");
  delete process.env.DATABASE_URL;

  const store = await import("../src/lib/stores/marriage-counseling-json");

  const journey = await store.createJourney({
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: "mod-01-knowing-yourself",
    counselorUserId: null,
    createdBy: "user-a",
    pairingMode: "journey_invite",
    participantAId: "user-a",
    participantBId: "user-b",
    curriculumVersion: MARRIAGE_COUNSELING_CONTENT_VERSION,
  });

  const moduleId = "mod-01-knowing-yourself";
  const version = MARRIAGE_COUNSELING_CONTENT_VERSION;

  await store.saveResponse({
    id: "r-a",
    journeyId: journey.id,
    moduleId,
    contentVersion: version,
    userId: "user-a",
    status: "draft",
    answers: { "kyp-recharge": "alone" },
    lastSavedAt: new Date().toISOString(),
  });

  const bDraft = await store.getResponse(journey.id, moduleId, "user-b");
  assert.equal(bDraft, null, "partner cannot read draft before save");

  await store.saveResponse({
    id: "r-b",
    journeyId: journey.id,
    moduleId,
    contentVersion: version,
    userId: "user-b",
    status: "draft",
    answers: { "kyp-recharge": "partner" },
    lastSavedAt: new Date().toISOString(),
  });

  const aSeesB = await store.getResponse(journey.id, moduleId, "user-b");
  assert.ok(aSeesB?.status === "draft", "store holds partner draft server-side only");

  await store.saveResponse({
    ...(await store.getResponse(journey.id, moduleId, "user-a"))!,
    status: "submitted",
    submittedAt: new Date().toISOString(),
  });
  await store.saveResponse({
    ...(await store.getResponse(journey.id, moduleId, "user-b"))!,
    status: "submitted",
    submittedAt: new Date().toISOString(),
  });

  await store.createUnlock({
    journeyId: journey.id,
    moduleId,
    contentVersion: version,
    unlockedAt: new Date().toISOString(),
  });

  const invite = await store.createInvite({
    id: "inv-1",
    code: "TESTCODE",
    journeyId: journey.id,
    createdBy: "user-a",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  });
  assert.equal(invite.code, "TESTCODE");

  await assert.rejects(
    () =>
      store.createInvite({
        id: "inv-2",
        code: "TESTCODE2",
        journeyId: journey.id,
        createdBy: "user-a",
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      }),
    /active invitation/,
  );

  const { getMarriageModule } = await import("../src/lib/marriage-counseling-curriculum");
  const mod = getMarriageModule(moduleId);
  assert.ok(mod);
  const ra = (await store.getResponse(journey.id, moduleId, "user-a"))!;
  const rb = (await store.getResponse(journey.id, moduleId, "user-b"))!;
  const items = buildSharedComparisonItems(mod!.questions, ra.answers, rb.answers);
  assert.ok(items.some((i) => i.category === "different" || i.category === "needs_conversation"));

  const curriculum = await import("../src/lib/stores/marriage-curriculum-json");
  const draft = await curriculum.saveCurriculumDraft({
    version: "test-2.0",
    modules: curriculum.seedModulesSnapshot().map((m) =>
      m.id === moduleId ? { ...m, title: "Changed title should not mutate old responses" } : m,
    ),
    createdBy: "admin",
    createdByName: "Admin",
  });
  assert.equal(ra.contentVersion, version, "submission keeps original content version after draft");

  process.env.MARRIAGE_COUNSELOR_USER_IDS = "counselor-1";
  const counselor = { id: "counselor-1", name: "Counselor Test" } as import("../src/lib/auth-types").PublicMember;
  const participant = { id: "user-a", name: "Partner A" } as import("../src/lib/auth-types").PublicMember;
  const stranger = { id: "user-x", name: "Stranger" } as import("../src/lib/auth-types").PublicMember;

  await store.applyCounselorJourneyAccessChange(journey.id, { counselorUserId: "counselor-1" });

  const {
    createCounselingSession,
    getCounselorJourneyDetail,
    saveCounselorPrivateNote,
    markHomeworkComplete,
    resolveRevisionRequest,
  } = await import("../src/lib/marriage-counseling-counselor-server");
  const { exportJourneyData } = await import("../src/lib/marriage-counseling-privacy-server");

  const session = await createCounselingSession(counselor, {
    journeyId: journey.id,
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    topic: "Integration session",
    zoomUrl: "https://zoom.example/test",
    homework: [{ title: "Pray together daily", dueAt: new Date(Date.now() + 604800000).toISOString() }],
  });
  assert.ok(session.id);

  await saveCounselorPrivateNote(counselor, journey.id, "Follow up on communication module.");
  const detail = await getCounselorJourneyDetail(counselor, journey.id);
  assert.equal(detail.access, "clinical");
  if (detail.access !== "clinical") throw new Error("Expected clinical counselor detail.");
  assert.ok(detail.sessions.some((s) => s.id === session.id));
  assert.ok(detail.assignments.length >= 1);
  assert.ok(detail.notes.some((n) => n.body.includes("communication")));
  assert.equal(detail.authorizedAnswers.length, 0, "no counselor-only answers in this fixture");

  await assert.rejects(() => getCounselorJourneyDetail(stranger, journey.id), /Access denied|Counselor access required/);

  const exported = await exportJourneyData(participant, journey.id);
  assert.ok(exported.responses.some((r) => r.moduleId === moduleId));
  assert.ok(exported.sessions.some((s) => s.topic === "Integration session"));
  await assert.rejects(() => exportJourneyData(stranger, journey.id), /not part of this journey/);

  const assignmentId = detail.assignments[0]!.id;
  await markHomeworkComplete(participant, assignmentId);
  const afterHomework = await store.getAssignmentById(assignmentId);
  assert.ok(afterHomework?.completedByUserIds.includes("user-a"));

  const revision = await store.createRevisionRequest({
    id: "rev-1",
    journeyId: journey.id,
    moduleId,
    userId: "user-a",
    status: "pending",
    requestedAt: new Date().toISOString(),
  });
  await resolveRevisionRequest(counselor, revision.id, "approved");
  const resolved = await store.getRevisionRequestById(revision.id);
  assert.equal(resolved?.status, "approved");

  const published = await curriculum.publishCurriculumVersion(draft.id, "admin", "Admin");
  assert.equal(published.status, "published");
  const moduleAtOldVersion = await (
    await import("../src/lib/marriage-curriculum-service")
  ).getModuleForContentVersion(moduleId, version);
  assert.ok(moduleAtOldVersion);
  assert.notEqual(moduleAtOldVersion!.title, "Changed title should not mutate old responses");

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELOR_USER_IDS;
  console.log("marriage-counseling-integration.ts: all checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
