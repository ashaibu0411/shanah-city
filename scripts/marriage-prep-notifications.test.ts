import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const server = readFileSync(join(root, "src/lib/marriage-prep-notifications-server.ts"), "utf8");
assert.match(server, /assertViewerCanAccessPrepNotification/, "notifications scoped by role and journey");
assert.match(server, /tryCreateMarriagePrepUserNotification/, "deduplicated in-app records");
assert.match(server, /sendPushToUsersWithPushEnabled/, "push respects pushEnabled preference");

const notify = readFileSync(join(root, "src/lib/marriage-counseling-notify.ts"), "utf8");
assert.match(notify, /deliverMarriagePrepNotifications/, "marriage notify uses unified delivery");
assert.doesNotMatch(notify, /privateObservations|answersJson/, "notify copy avoids private fields");

const api = readFileSync(join(root, "src/app/api/marriage/notifications/route.ts"), "utf8");
assert.match(api, /getUserFromSession/, "notifications API requires auth");

const hub = readFileSync(join(root, "src/components/marriage/MarriageCoupleHubDashboard.tsx"), "utf8");
assert.match(hub, /MarriagePrepNotificationCenter/, "hub includes notification center");
assert.match(hub, /What to do next/, "hub action center");

const completion = readFileSync(
  join(root, "src/components/marriage/MarriageCoupleProgramCompletionBanner.tsx"),
  "utf8",
);
assert.match(completion, /does not automatically mean pastoral approval/, "completion disclaimer");

console.log("marriage-prep-notifications.test.ts: OK");
