/**
 * Runtime regression: hub summary for waiting vs joined premarital couples.
 * Run: npm run test:marriage:hub-partner-gate
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MARRIAGE_CONSENT_VERSION, MARRIAGE_COUNSELING_CONTENT_VERSION } from "../src/lib/marriage-counseling-curriculum";

async function withJsonStore<T>(fn: () => Promise<T>): Promise<T> {
  const dir = mkdtempSync(join(tmpdir(), "marriage-hub-gate-"));
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

async function runWaitingPartnerCase(
  store: typeof import("../src/lib/stores/marriage-counseling-json"),
  getMarriageHubSummary: typeof import("../src/lib/marriage-counseling-server").getMarriageHubSummary,
) {
  {

    const viewerA = { id: "user-wait-a", name: "Partner A", email: "a@test.local" };

    const waitingJourney = await store.createJourney({
      coupleLinkId: "",
      programType: "premarital",
      status: "active",
      currentModuleId: "mod-01-knowing-yourself",
      counselorUserId: null,
      createdBy: viewerA.id,
      pairingMode: "journey_invite",
      participantAId: viewerA.id,
      participantBId: "",
      curriculumVersion: MARRIAGE_COUNSELING_CONTENT_VERSION,
    });

    await store.upsertConsent({
      id: `consent-${waitingJourney.id}-a`,
      journeyId: waitingJourney.id,
      userId: viewerA.id,
      consentVersion: MARRIAGE_CONSENT_VERSION,
      grantedAt: new Date().toISOString(),
    });

    await store.createInvite({
      id: `inv-${waitingJourney.id}`,
      journeyId: waitingJourney.id,
      code: "WAITCODE1",
      createdBy: viewerA.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    const waitingHub = await getMarriageHubSummary(viewerA);

    assert.equal(waitingHub.partnerJoined, false, "waiting partner: partnerJoined false");
    assert.equal(waitingHub.myConsent, true, "waiting partner: individual consent preserved");
    assert.equal(waitingHub.partnerConsent, false);
    assert.ok(waitingHub.journey?.id === waitingJourney.id);
    assert.equal(waitingHub.premaritalProgram, null, "no couple premarital program before join");
    assert.equal(waitingHub.premaritalAppointments, undefined);
    assert.equal(waitingHub.certificatesGallery, undefined);
    assert.deepEqual(waitingHub.sessionHomework, []);
  }
}

async function runJoinedCoupleCase(
  store: typeof import("../src/lib/stores/marriage-counseling-json"),
  getMarriageHubSummary: typeof import("../src/lib/marriage-counseling-server").getMarriageHubSummary,
) {
  {

    const viewerA = { id: "user-join-a", name: "Partner A", email: "join-a@test.local" };
    const viewerB = { id: "user-join-b", name: "Partner B", email: "join-b@test.local" };

    const joinedJourney = await store.createJourney({
      coupleLinkId: "",
      programType: "premarital",
      status: "active",
      currentModuleId: "mod-01-knowing-yourself",
      counselorUserId: null,
      createdBy: viewerA.id,
      pairingMode: "journey_invite",
      participantAId: viewerA.id,
      participantBId: viewerB.id,
      curriculumVersion: MARRIAGE_COUNSELING_CONTENT_VERSION,
    });

    await store.upsertConsent({
      id: `consent-${joinedJourney.id}-a`,
      journeyId: joinedJourney.id,
      userId: viewerA.id,
      consentVersion: MARRIAGE_CONSENT_VERSION,
      grantedAt: new Date().toISOString(),
    });
    await store.upsertConsent({
      id: `consent-${joinedJourney.id}-b`,
      journeyId: joinedJourney.id,
      userId: viewerB.id,
      consentVersion: MARRIAGE_CONSENT_VERSION,
      grantedAt: new Date().toISOString(),
    });

    const joinedHub = await getMarriageHubSummary(viewerA);

    assert.equal(joinedHub.partnerJoined, true);
    assert.equal(joinedHub.myConsent, true);
    assert.equal(joinedHub.partnerConsent, true);
    assert.ok(joinedHub.premaritalProgram !== null, "joined couple loads premarital program");
    assert.ok(Array.isArray(joinedHub.premaritalAppointments));
    assert.ok(joinedHub.certificatesGallery);
  }
}

async function main() {
  await withJsonStore(async () => {
    const store = await import("../src/lib/stores/marriage-counseling-json");
    const { getMarriageHubSummary } = await import("../src/lib/marriage-counseling-server");
    await runWaitingPartnerCase(store, getMarriageHubSummary);
    await runJoinedCoupleCase(store, getMarriageHubSummary);
  });
  console.log("marriage-hub-partner-gate.test.ts: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
