import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  bothPartnersConsentedUserIds,
  shouldQueueDefaultPremaritalCounselorAssignment,
} from "../src/lib/marriage-default-premarital-counselor-eligibility";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const base = {
  programType: "premarital",
  activeCounselorUserId: null,
  configuredCounselorUserId: "counselor-zaq",
  automationRequestedByUserId: "admin-other",
  participantAId: "partner-a",
  participantBId: "partner-b",
  consentedUserIds: ["partner-a", "partner-b"],
  hasPendingAssignmentRequest: false,
  hasApprovedAssignmentAwaitingExecution: false,
};

assert.equal(shouldQueueDefaultPremaritalCounselorAssignment(base), true);

assert.equal(
  shouldQueueDefaultPremaritalCounselorAssignment({
    ...base,
    consentedUserIds: ["partner-a"],
  }),
  false,
  "waits until both partners consent",
);

assert.equal(
  shouldQueueDefaultPremaritalCounselorAssignment({
    ...base,
    hasPendingAssignmentRequest: true,
  }),
  false,
  "idempotent when pending exists",
);

assert.equal(
  shouldQueueDefaultPremaritalCounselorAssignment({
    ...base,
    activeCounselorUserId: "existing-counselor",
  }),
  false,
  "skips when counselor already assigned",
);

assert.equal(
  shouldQueueDefaultPremaritalCounselorAssignment({
    ...base,
    configuredCounselorUserId: null,
  }),
  false,
);

assert.equal(
  shouldQueueDefaultPremaritalCounselorAssignment({
    ...base,
    automationRequestedByUserId: "counselor-zaq",
  }),
  false,
  "blocks self-assign automation requester",
);

assert.equal(
  shouldQueueDefaultPremaritalCounselorAssignment({
    ...base,
    programType: "enrichment",
  }),
  false,
);

assert.equal(bothPartnersConsentedUserIds("a", null, ["a"]), false);

const apiRoute = readFileSync(
  join(root, "src/app/api/marriage/admin/default-premarital-counselor/route.ts"),
  "utf8",
);
assert.match(apiRoute, /getUserFromSession/, "default counselor API requires session");
assert.match(apiRoute, /assertCanManageDefaultPremaritalCounselorSetting/, "server-side auth");

const sessionPerms = readFileSync(join(root, "src/lib/session-permissions.ts"), "utf8");
assert.match(
  sessionPerms,
  /canAccessMarriageCounselorAssignmentsNav/,
  "session exposes counselor assignment nav permission",
);

const navBuilder = readFileSync(join(root, "src/lib/use-app-nav-items.ts"), "utf8");
assert.match(
  navBuilder,
  /marriageCounselorAssignmentsNavItem/,
  "global nav includes counselor assignments for authorized users",
);

const consentHook = readFileSync(join(root, "src/lib/marriage-counseling-server.ts"), "utf8");
assert.match(
  consentHook,
  /queueDefaultPremaritalCounselorAssignmentIfEligible/,
  "consent records trigger default queue",
);

const inviteHook = readFileSync(join(root, "src/lib/marriage-counseling-invite-server.ts"), "utf8");
assert.match(inviteHook, /queueDefaultPremaritalCounselorAssignmentIfEligible/);

const assignmentServer = readFileSync(
  join(root, "src/lib/marriage-counselor-assignment-request-server.ts"),
  "utf8",
);
assert.match(
  assignmentServer,
  /existingPending/,
  "duplicate pending assign requests prevented",
);

console.log("marriage-default-premarital-counselor.test.ts: OK");
