import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildHubUpcomingSessionsFromRecords,
  filterSortUpcomingJourneySessions,
} from "../src/lib/marriage-hub-upcoming-sessions";
import { parseDateTimeLocalInTimeZone } from "../src/lib/marriage-session-scheduling";
import type { MarriageCounselingSessionRecord } from "../src/lib/marriage-counseling-types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const opsServer = readFileSync(
  join(root, "src/lib/marriage-premarital-operations-server.ts"),
  "utf8",
);
assert.match(opsServer, /assertClinicalCounselorForJourney/, "appointments require assigned counselor");
assert.match(opsServer, /assertSeniorPastor/, "readiness review requires Senior Pastor");
assert.match(opsServer, /savePremaritalReadinessReviewAudit/, "readiness saves audit trail");
assert.doesNotMatch(
  opsServer,
  /ready_to_proceed[\s\S]*savePremaritalProgramProgress|markSessionComplete/i,
  "operations server must not auto-complete program modules from readiness",
);

const premaritalRoute = readFileSync(
  join(root, "src/app/api/marriage/counselor/premarital-operations/route.ts"),
  "utf8",
);
assert.match(premaritalRoute, /getUserFromSession/, "premarital-operations route authenticates");
assert.match(premaritalRoute, /buildCounselorPremaritalOperationsView/, "GET delegates to server view");

const notify = readFileSync(join(root, "src/lib/marriage-counseling-notify.ts"), "utf8");
assert.match(notify, /notifyMarriageAppointmentUpcoming/, "appointment reminder helper exists");
assert.doesNotMatch(
  notify,
  /privateObservations|answersJson|assessmentOverview/i,
  "push copy must not reference private counseling fields",
);

const reminders = readFileSync(
  join(root, "src/lib/marriage-premarital-reminders-server.ts"),
  "utf8",
);
assert.match(reminders, /notifyMarriageAppointmentUpcoming/, "reminders delegate to unified notify");
const prepNotify = readFileSync(join(root, "src/lib/marriage-prep-notifications-server.ts"), "utf8");
assert.match(prepNotify, /tryRecordPremaritalReminderDelivery/, "push dedupe via reminder delivery log");
assert.match(prepNotify, /tryCreateMarriagePrepUserNotification/, "in-app dedupe via unique notification rows");

const migration = readFileSync(
  join(root, "prisma/migrations/20261024200000_marriage_premarital_operations/migration.sql"),
  "utf8",
);
assert.match(migration, /MarriagePremaritalReadinessReviewAudit/, "migration adds readiness audit");

const tz = "America/Denver";
const parsed = parseDateTimeLocalInTimeZone("2026-06-15T09:30", tz);
assert.equal(parsed.ok, true);
if (parsed.ok) {
  assert.ok(parsed.iso.includes("T"), "timezone scheduling produces ISO instant");
}

const futureMs = Date.parse("2030-01-01T12:00:00.000Z");
const session: MarriageCounselingSessionRecord = {
  id: "s1",
  journeyId: "j1",
  scheduledAt: "2030-01-01T12:00:00.000Z",
  schedulingTimeZone: tz,
  premaritalSessionKey: "session-1-foundations",
  status: "scheduled",
  createdBy: "counselor",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};
const cancelled: MarriageCounselingSessionRecord = { ...session, id: "s2", status: "cancelled" };
const sorted = filterSortUpcomingJourneySessions([session, cancelled], futureMs);
assert.equal(sorted.length, 1);
const hub = buildHubUpcomingSessionsFromRecords([session, cancelled], { nowMs: futureMs });
assert.equal(hub.length, 1);
assert.ok(
  hub[0]!.premaritalSessionTitle?.includes("Foundations"),
  "hub view exposes premarital session title",
);

console.log("marriage-premarital-operations.test.ts: OK");
