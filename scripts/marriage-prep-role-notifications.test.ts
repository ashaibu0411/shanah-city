import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const server = readFileSync(join(root, "src/lib/marriage-prep-notifications-server.ts"), "utf8");
assert.match(server, /assertViewerCanAccessPrepNotification/, "role-aware inbox access");
assert.match(server, /assertRecipientsForAudience/, "recipient routing by audience");
assert.match(server, /viewerIsAssignedClinicalCounselor/, "counselor reassignment access gate");
assert.match(server, /isSeniorPastor/, "senior pastor notification gate");
assert.match(server, /assertAssignmentAdminOnJourney/, "assignment admin scope");

const kinds = readFileSync(join(root, "src/lib/marriage-prep-notification-kinds.ts"), "utf8");
assert.match(kinds, /counselor_new_assignment/, "counselor kinds");
assert.match(kinds, /sp_assignment_pending/, "senior pastor kinds");
assert.match(kinds, /admin_coordinator_assigned/, "admin kinds");

const triggers = readFileSync(join(root, "src/lib/marriage-prep-notification-triggers.ts"), "utf8");
assert.match(triggers, /notifyCoupleAndCounselorAssignmentActivated/, "assignment activation notify");
assert.match(triggers, /notifyCounselorHomeworkSubmitted/, "homework submission routing");
assert.match(triggers, /counselor_appointment_upcoming/, "counselor upcoming appointment kind");
assert.doesNotMatch(triggers, /privateObservations|answersJson/, "trigger copy avoids private fields");

const reminders = readFileSync(join(root, "src/lib/marriage-premarital-reminders-server.ts"), "utf8");
assert.match(reminders, /notifyCounselorAppointmentUpcoming/, "counselor appointment reminders");
assert.match(reminders, /notifyCounselorAttendanceMissing/, "attendance missing reminders");

const homework = readFileSync(join(root, "src/lib/marriage-homework-server.ts"), "utf8");
assert.match(homework, /notifyCounselorHomeworkSubmitted/, "homework submit wires counselor notify");

const assignment = readFileSync(
  join(root, "src/lib/marriage-counselor-assignment-request-server.ts"),
  "utf8",
);
assert.match(assignment, /notifySeniorPastorAssignmentPending/, "SP approval pending notify");
assert.match(assignment, /notifyCoupleAndCounselorAssignmentActivated/, "post-approval couple+counselor");

const commandCenter = readFileSync(
  join(root, "src/components/marriage/MarriageCounselorCommandCenter.tsx"),
  "utf8",
);
assert.match(commandCenter, /MarriagePrepNotificationCenter/, "counselor inbox UI");

const adminPage = readFileSync(
  join(root, "src/components/marriage/MarriageCounselorAssignmentWorkspace.tsx"),
  "utf8",
);
assert.match(adminPage, /MarriagePrepNotificationCenter/, "admin/sp inbox UI");

console.log("marriage-prep-role-notifications.test.ts: OK");
