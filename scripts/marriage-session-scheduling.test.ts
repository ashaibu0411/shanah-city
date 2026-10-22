import assert from "node:assert/strict";
import {
  classifyStoredScheduledAt,
  formatMarriageSessionScheduledAt,
  MARRIAGE_COUNSELING_SCHEDULING_TIMEZONE,
  normalizeNewSessionScheduledAtInput,
  parseDateTimeLocalInTimeZone,
  parseStoredSessionScheduledAt,
} from "../src/lib/marriage-session-scheduling";

function main() {
  // Denver daylight saving (MDT): Oct 30, 2026 7:00 PM → Oct 31 01:00 UTC
  const dst = normalizeNewSessionScheduledAtInput({
    scheduledAtLocal: "2026-10-30T19:00",
    schedulingTimeZone: "America/Denver",
  });
  assert.equal(dst.scheduledAt, "2026-10-31T01:00:00.000Z");
  assert.equal(dst.schedulingTimeZone, "America/Denver");

  // Denver standard time (MST): Jan 15, 2026 7:00 PM → Jan 16 02:00 UTC
  const std = normalizeNewSessionScheduledAtInput({
    scheduledAtLocal: "2026-01-15T19:00",
    schedulingTimeZone: "America/Denver",
  });
  assert.equal(std.scheduledAt, "2026-01-16T02:00:00.000Z");

  // Spring-forward gap (2026-03-08 2:30 AM Denver does not exist)
  const gap = parseDateTimeLocalInTimeZone("2026-03-08T02:30", "America/Denver");
  assert.equal(gap.ok, false);

  // Legacy naive JSON value — display as Denver wall clock (not browser local)
  const legacyNaive = "2026-10-30T19:00";
  assert.equal(classifyStoredScheduledAt(legacyNaive), "naive_local");
  const legacyInstant = parseStoredSessionScheduledAt(legacyNaive, MARRIAGE_COUNSELING_SCHEDULING_TIMEZONE);
  assert.ok(legacyInstant);
  assert.equal(legacyInstant!.toISOString(), "2026-10-31T01:00:00.000Z");

  // Legacy wrong UTC from prior server bug — left unchanged, formatted in Denver
  const legacyWrongUtc = "2026-10-30T19:00:00.000Z";
  assert.equal(classifyStoredScheduledAt(legacyWrongUtc), "utc_instant");
  const wrongDisplay = formatMarriageSessionScheduledAt(legacyWrongUtc);
  assert.match(wrongDisplay, /Oct 30, 2026/);
  assert.match(wrongDisplay, /1:00 PM/);

  // Correct UTC — consistent counselor displays
  const correctUtc = "2026-10-31T01:00:00.000Z";
  const workspaceLabel = formatMarriageSessionScheduledAt(correctUtc);
  const clinicalLabel = formatMarriageSessionScheduledAt(correctUtc, MARRIAGE_COUNSELING_SCHEDULING_TIMEZONE);
  assert.equal(workspaceLabel, clinicalLabel);
  assert.match(workspaceLabel, /Oct 30, 2026/);
  assert.match(workspaceLabel, /7:00 PM/);

  console.log("marriage-session-scheduling.test.ts: ok");
}

main();
