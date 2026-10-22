import assert from "node:assert/strict";
import {
  classifyStoredScheduledAt,
  formatMarriageSessionScheduledAt,
  normalizeAssignmentDueAtInput,
  normalizeNewSessionScheduledAtInput,
  parseDateTimeLocalInTimeZone,
} from "../src/lib/marriage-session-scheduling";

async function main() {
  const nov13 = normalizeAssignmentDueAtInput({
    dueAtLocal: "2026-11-13T19:00",
    schedulingTimeZone: "America/Denver",
  });
  assert.ok(nov13);
  assert.equal(nov13!.dueAt, "2026-11-14T02:00:00.000Z");
  assert.equal(nov13!.dueAtTimeZone, "America/Denver");

  const mdt = normalizeAssignmentDueAtInput({
    dueAtLocal: "2026-10-30T19:00",
    schedulingTimeZone: "America/Denver",
  });
  assert.equal(mdt!.dueAt, "2026-10-31T01:00:00.000Z");

  const gap = parseDateTimeLocalInTimeZone("2026-03-08T02:30", "America/Denver");
  assert.equal(gap.ok, false);
  assert.throws(
    () =>
      normalizeAssignmentDueAtInput({
        dueAtLocal: "2026-03-08T02:30",
        schedulingTimeZone: "America/Denver",
      }),
    /daylight saving/,
  );

  const legacyWrongUtc = "2026-11-13T19:00:00.000Z";
  const preserved = normalizeAssignmentDueAtInput({ dueAt: legacyWrongUtc });
  assert.equal(preserved!.dueAt, legacyWrongUtc);

  const legacyNaive = "2026-11-13T19:00";
  assert.equal(classifyStoredScheduledAt(legacyNaive), "naive_local");
  const fromNaive = normalizeAssignmentDueAtInput({ dueAt: legacyNaive });
  assert.equal(fromNaive!.dueAt, "2026-11-14T02:00:00.000Z");

  const sessionHomeworkIso = "2026-11-14T02:00:00.000Z";
  const once = normalizeAssignmentDueAtInput({
    dueAt: sessionHomeworkIso,
    schedulingTimeZone: "America/Denver",
  });
  const twice = normalizeAssignmentDueAtInput({
    dueAt: once!.dueAt,
    schedulingTimeZone: once!.dueAtTimeZone,
  });
  assert.equal(once!.dueAt, twice!.dueAt);

  const naiveSessionHomework = normalizeAssignmentDueAtInput({
    dueAt: "2026-10-30T19:00",
    schedulingTimeZone: "America/Denver",
  });
  const sessionNormalized = normalizeNewSessionScheduledAtInput({
    scheduledAtLocal: "2026-10-30T19:00",
    schedulingTimeZone: "America/Denver",
  });
  assert.equal(naiveSessionHomework!.dueAt, sessionNormalized.scheduledAt);

  const counselorLabel = formatMarriageSessionScheduledAt(nov13!.dueAt, nov13!.dueAtTimeZone);
  const participantLabel = formatMarriageSessionScheduledAt(nov13!.dueAt, "America/Denver");
  assert.equal(counselorLabel, participantLabel);
  assert.match(counselorLabel, /Nov 13, 2026/);
  assert.match(counselorLabel, /7:00 PM/);

  const wrongDisplay = formatMarriageSessionScheduledAt(legacyWrongUtc);
  assert.match(wrongDisplay, /12:00 PM/);

  const { createCounselorActivityAssignment } = await import(
    "../src/lib/marriage-counseling-counselor-server"
  );
  const stranger = { id: "user-not-counselor", name: "Stranger" } as import("../src/lib/auth-types").PublicMember;
  await assert.rejects(
    () =>
      createCounselorActivityAssignment(stranger, {
        journeyId: "journey-does-not-exist",
        title: "Unauthorized",
      }),
    /Access denied/,
  );

  console.log("marriage-assignment-due-scheduling.test.ts: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
