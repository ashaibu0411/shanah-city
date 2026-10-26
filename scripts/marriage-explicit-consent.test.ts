/**
 * Explicit consent: invite flows do not auto-record consent; waiting partner can consent.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MARRIAGE_CONSENT_VERSION, MARRIAGE_COUNSELING_CONTENT_VERSION } from "../src/lib/marriage-counseling-curriculum";
import { buildCoupleOnboardingView } from "../src/lib/marriage-couple-onboarding-server";

async function withJsonStore<T>(fn: () => Promise<T>): Promise<T> {
  const dir = mkdtempSync(join(tmpdir(), "marriage-consent-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage-counseling.json");
  process.env.MARRIAGE_CURRICULUM_DATA_FILE = join(dir, "marriage-curriculum.json");
  delete process.env.DATABASE_URL;
  process.env.NEXT_PUBLIC_MARRIAGE_STAGE2 = "0";
  process.env.MARRIAGE_HUB_STAGE2_ENABLED = "0";
  try {
    return await fn();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function main() {
  await withJsonStore(async () => {
    const { startJourneyWithInvite } = await import("../src/lib/marriage-counseling-invite-server");
    const { recordMarriageConsent, getMarriageHubSummary } = await import("../src/lib/marriage-counseling-server");
    const store = (await import("../src/lib/stores/marriage-counseling-store")).marriageStore();

    const viewerA = { id: "user-a", name: "A", email: "a@test.local" };
    const { journey } = await startJourneyWithInvite(viewerA, "premarital");

    const consentsAfterInvite = await store.getConsentsForJourney(journey.id);
    assert.equal(
      consentsAfterInvite.filter((c) => c.userId === viewerA.id && c.consentVersion === MARRIAGE_CONSENT_VERSION)
        .length,
      0,
      "invite create must not auto-record consent",
    );

    await recordMarriageConsent(viewerA, journey.id);
    const hub = await getMarriageHubSummary(viewerA);
    assert.equal(hub.myConsent, true);
    assert.equal(hub.partnerJoined, false);

    const onboarding = buildCoupleOnboardingView({
      signedIn: true,
      coupleLinkActive: false,
      hasJourney: true,
      partnerJoined: false,
      myConsent: true,
      partnerConsent: false,
      counselorSummary: null,
    });
    const consentStep = onboarding.steps.find((s) => s.id === "consent");
    assert.equal(consentStep?.complete, true);
    assert.ok(!onboarding.steps.some((s) => s.id === "partner_consent"));
  });

  console.log("marriage-explicit-consent.test.ts: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
