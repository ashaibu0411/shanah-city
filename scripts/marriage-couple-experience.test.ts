import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCoupleOnboardingView } from "../src/lib/marriage-couple-onboarding-server.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const hubServer = readFileSync(join(root, "src/lib/marriage-counseling-server.ts"), "utf8");
assert.match(hubServer, /buildCoupleOnboardingView/, "hub summary includes couple onboarding");
assert.match(hubServer, /premaritalAppointmentNotices/, "hub exposes appointment cancellation notices");

const premarital = readFileSync(join(root, "src/lib/marriage-premarital-program-server.ts"), "utf8");
assert.match(premarital, /buildCoupleAppointmentViews/, "premarital couple view maps session appointments");

const hubUi = readFileSync(join(root, "src/components/marriage/MarriageCounselingHub.tsx"), "utf8");
assert.match(hubUi, /MarriageCoupleHubDashboard/, "marriage hub uses couple dashboard");

const hubDash = readFileSync(join(root, "src/components/marriage/MarriageCoupleHubDashboard.tsx"), "utf8");
assert.match(hubDash, /What to do next/, "consolidated couple action center");
assert.doesNotMatch(hubUi, /reschedule request/i, "no fake reschedule UI on hub");

const tracker = readFileSync(
  join(root, "src/components/marriage/MarriageCoupleSessionProgressTracker.tsx"),
  "utf8",
);
assert.match(
  tracker,
  /does not automatically complete a session/,
  "tracker clarifies session completion is not from assessments",
);

const help = readFileSync(join(root, "src/components/marriage/MarriageCoupleHelpSection.tsx"), "utf8");
assert.match(help, /do not promise absolute secrecy/i, "help mentions confidentiality limits");

const onboardingEarly = buildCoupleOnboardingView({
  signedIn: true,
  coupleLinkActive: false,
  hasJourney: false,
  partnerJoined: false,
  myConsent: false,
  partnerConsent: false,
  counselorSummary: null,
});
assert.equal(onboardingEarly.currentStepId, "journey", "unsigned journey shows journey step");

const onboardingConsent = buildCoupleOnboardingView({
  signedIn: true,
  coupleLinkActive: true,
  hasJourney: true,
  partnerJoined: true,
  myConsent: true,
  partnerConsent: false,
  counselorSummary: null,
});
assert.equal(onboardingConsent.currentStepId, "consent", "waits on partner consent");

console.log("marriage-couple-experience.test.ts: OK");
