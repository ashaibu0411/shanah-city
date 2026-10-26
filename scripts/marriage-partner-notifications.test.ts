import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const joinNotify = readFileSync(join(root, "src/lib/marriage-partner-join-notify.ts"), "utf8");
assert.match(joinNotify, /notifyHostThatPartnerJoined/, "unified partner joined notify");
assert.match(joinNotify, /findJourneyForPartnerJoinedInApp/, "journey-scoped in-app delivery");

const coupleLink = readFileSync(join(root, "src/lib/couple-link-server.ts"), "utf8");
assert.match(coupleLink, /notifyAfterCoupleLinkAccepted/, "couple link accept notifies host");

const invite = readFileSync(join(root, "src/lib/marriage-counseling-invite-server.ts"), "utf8");
assert.match(invite, /notifyHostThatPartnerJoined/, "invite accept uses unified notify");

const notifyServer = readFileSync(join(root, "src/lib/marriage-prep-notifications-server.ts"), "utf8");
assert.match(notifyServer, /userIsOpenInviteeForJourney/, "pending invitee authorization");
assert.match(notifyServer, /pending_invitee/, "invitee audience in access control");

const triggers = readFileSync(join(root, "src/lib/marriage-prep-notification-triggers.ts"), "utf8");
assert.match(triggers, /referenceKey: joinedUserId/, "partner joined dedupe key");

async function main() {
  process.env.USE_DATABASE = "0";
  process.env.DATABASE_URL = "";
  const { marriageStore } = await import("../src/lib/stores/marriage-counseling-store");
  const store = marriageStore();
  const journey = await store.createJourney({
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: "mod-01-knowing-yourself",
    counselorUserId: null,
    createdBy: "host-user",
    pairingMode: "journey_invite",
    participantAId: "host-user",
    participantBId: "partner-user",
    curriculumVersion: "2026.1",
  });
  const { notifyHostPartnerJoined } = await import("../src/lib/marriage-prep-notification-triggers");
  const first = await notifyHostPartnerJoined(journey, "partner-user");
  const second = await notifyHostPartnerJoined(journey, "partner-user");
  assert.ok(first.created >= 1, "first partner_joined notification created");
  assert.equal(second.created, 0, "retry must not duplicate partner_joined");
  console.log("marriage-partner-notifications.test.ts: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
