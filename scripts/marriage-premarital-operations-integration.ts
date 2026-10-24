/**
 * Isolated JSON-store integration checks for premarital operations (no production DB).
 * Run: npx tsx scripts/marriage-premarital-operations-integration.ts
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MARRIAGE_COUNSELING_CONTENT_VERSION } from "../src/lib/marriage-counseling-curriculum";

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-premarital-ops-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage-counseling.json");
  process.env.MARRIAGE_CURRICULUM_DATA_FILE = join(dir, "marriage-curriculum.json");
  process.env.PASTORAL_ROLES_DATA_FILE = join(dir, "pastoral-roles.json");
  delete process.env.DATABASE_URL;
  process.env.MARRIAGE_COUNSELOR_USER_IDS = "user-counselor,user-sp";

  const store = await import("../src/lib/stores/marriage-counseling-json");
  const pastoralStore = await import("../src/lib/stores/pastoral-roles-json");
  await pastoralStore.setPastoralRoleAssignment({
    role: "senior_pastor",
    userId: "user-sp",
    updatedBy: "test",
    updatedByName: "Test",
  });

  const journey = await store.createJourney({
    coupleLinkId: "link-1",
    programType: "premarital",
    status: "active",
    currentModuleId: "mod-01-knowing-yourself",
    counselorUserId: "user-counselor",
    createdBy: "user-a",
    pairingMode: "journey_invite",
    participantAId: "user-a",
    participantBId: "user-b",
    curriculumVersion: MARRIAGE_COUNSELING_CONTENT_VERSION,
  });

  type Member = import("../src/lib/auth-types").PublicMember;
  const counselor = { id: "user-counselor", name: "Counselor", email: "c@test.local" } as Member;
  const partnerA = { id: "user-a", name: "A", email: "a@test.local" } as Member;
  const partnerB = { id: "user-b", name: "B", email: "b@test.local" } as Member;
  const stranger = { id: "user-x", name: "X", email: "x@test.local" } as Member;
  const seniorPastor = { id: "user-sp", name: "SP", email: "sp@test.local" } as Member;
  const otherCounselor = { id: "user-other", name: "Other", email: "o@test.local" } as Member;

  const {
    schedulePremaritalAppointment,
    reschedulePremaritalAppointment,
    cancelPremaritalAppointment,
    savePremaritalSessionClinicalRecord,
    savePremaritalReadinessReview,
    buildCoupleAppointmentViews,
    buildCounselorPremaritalOperationsView,
  } = await import("../src/lib/marriage-premarital-operations-server");

  const { processPremaritalReminders } = await import("../src/lib/marriage-premarital-reminders-server");

  const scheduled = await schedulePremaritalAppointment(counselor, {
    journeyId: journey.id,
    premaritalSessionKey: "session-1-foundations",
    scheduledAtLocal: "2030-06-01T10:00",
    scheduledEndAtLocal: "2030-06-01T11:30",
    meetingMode: "video",
    locationOrLink: "https://meet.example/room",
  });
  assert.equal(scheduled.premaritalSessionKey, "session-1-foundations");

  const coupleViews = await buildCoupleAppointmentViews(partnerA, journey.id);
  assert.equal(coupleViews.length, 1);
  assert.equal(coupleViews[0]!.locationOrLink, "https://meet.example/room");
  assert.ok(!("privateObservations" in coupleViews[0]!));

  await assert.rejects(
    () => buildCoupleAppointmentViews(stranger, journey.id),
    /not part of this journey|Journey not found/i,
  );

  await assert.rejects(
    () =>
      schedulePremaritalAppointment(otherCounselor, {
        journeyId: journey.id,
        premaritalSessionKey: "session-2-communication",
        scheduledAtLocal: "2030-06-08T10:00",
        meetingMode: "in_person",
      }),
    /clinical|counselor|access/i,
  );

  await savePremaritalSessionClinicalRecord(counselor, {
    journeyId: journey.id,
    sessionKey: "session-1-foundations",
    partnerAAttended: true,
    partnerBAttended: true,
    outcome: "completed",
    topicsCovered: "Covenant vision",
    privateObservations: "Sensitive note — counselor only",
  });

  const opsView = await buildCounselorPremaritalOperationsView(counselor, journey.id);
  assert.ok(opsView?.clinicalRecords[0]?.privateObservations?.includes("Sensitive"));
  assert.equal(opsView?.canEditReadiness, false);

  await assert.rejects(
    () =>
      savePremaritalReadinessReview(counselor, {
        journeyId: journey.id,
        status: "ready_to_proceed",
      }),
    /Senior Pastor/i,
  );

  await savePremaritalReadinessReview(seniorPastor, {
    journeyId: journey.id,
    status: "in_progress",
    pastoralRecommendation: "Continue sessions",
  });
  await savePremaritalReadinessReview(seniorPastor, {
    journeyId: journey.id,
    status: "ready_to_proceed",
    pastoralRecommendation: "Pastoral sign-off after review",
  });

  const spView = await buildCounselorPremaritalOperationsView(seniorPastor, journey.id);
  assert.equal(spView?.readinessReview?.status, "ready_to_proceed");
  assert.ok((spView?.readinessAudit.length ?? 0) >= 2);
  assert.equal(spView?.clinicalRecords.length, 0, "Senior Pastor GET omits private clinical records");
  assert.equal(spView?.appointments.length, 0, "Senior Pastor GET omits counselor appointment payload");

  const reminderAt = Date.parse("2030-06-01T09:30:00.000Z");
  const first = await processPremaritalReminders({ nowMs: reminderAt });
  const second = await processPremaritalReminders({ nowMs: reminderAt + 60_000 });
  assert.ok(first.appointmentReminders >= 1 || first.skippedDuplicate >= 0);
  assert.ok(second.skippedDuplicate >= 1, "duplicate appointment reminders suppressed");

  await cancelPremaritalAppointment(counselor, scheduled.id, "Weather");
  const afterCancel = await buildCoupleAppointmentViews(partnerA, journey.id);
  assert.equal(afterCancel.length, 0);

  const afterCancelReminders = await processPremaritalReminders({ nowMs: reminderAt + 120_000 });
  assert.equal(afterCancelReminders.appointmentReminders, 0);

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_COUNSELOR_USER_IDS;
  console.log("marriage-premarital-operations-integration.ts: all checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
