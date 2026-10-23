/**
 * Marriage Prep — single active journey + hub selection lifecycle.
 * Run: npx.cmd tsx scripts/marriage-active-journey-lifecycle.test.ts
 */
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PublicMember } from "../src/lib/auth-types";
import {
  isAbandonedInviteShell,
  MARRIAGE_INVITE_BLOCK_SPOUSE_LINK,
  pickHubActiveJourneyFromEngagements,
  resolveHubActiveJourneyForUser,
} from "../src/lib/marriage-active-journey-lifecycle";

function member(id: string): PublicMember {
  return { id, name: id, email: `${id}@test.local`, role: "member" } as PublicMember;
}

function setupEnv(root: string) {
  const dataDir = join(root, "data");
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(
    join(dataDir, "users.json"),
    JSON.stringify([
      { id: "u-a", name: "A", email: "a@test.local", role: "member" },
      { id: "u-b", name: "B", email: "b@test.local", role: "member" },
    ]),
  );
  writeFileSync(join(dataDir, "groups.json"), JSON.stringify([]));
  writeFileSync(
    join(dataDir, "pastoral-roles.json"),
    JSON.stringify({ seniorPastorUserId: null, associatePastorUserId: null }),
  );
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dataDir, "marriage-counseling.json");
  delete process.env.DATABASE_URL;
  process.env.MARRIAGE_COUNSELOR_USER_IDS = "c-1";
}

async function main() {
  const root = mkdtempSync(join(tmpdir(), "mj-lifecycle-"));
  const prev = process.cwd();
  process.chdir(root);
  setupEnv(root);

  try {
    const jsonStore = await import("../src/lib/stores/marriage-counseling-json");
    const { startJourneyWithInvite, acceptJourneyInvite } = await import(
      "../src/lib/marriage-counseling-invite-server"
    );
    const { assertParticipantsMayStartNewJourney } = await import(
      "../src/lib/marriage-active-journey-lifecycle"
    );
    const { assertClinicalCounselorForJourney } = await import(
      "../src/lib/marriage-counseling-access"
    );
    const { buildJourneyEngagement } = await import("../src/lib/marriage-active-journey-lifecycle");

    // Duplicate prevention: invite blocks spouse-link start for both participants
    {
      await startJourneyWithInvite(member("u-a"), "premarital");
      await assert.rejects(
        () =>
          assertParticipantsMayStartNewJourney({
            participantUserIds: ["u-a", "u-b"],
            coupleLinkId: "cl-new",
          }),
        (err: Error) => err.message.includes("invitation-only"),
      );
    }

    // Hub selection prefers spouse-link with progress over empty invite
    {
      const invite = await jsonStore.createJourney({
        coupleLinkId: "",
        programType: "premarital",
        status: "active",
        currentModuleId: null,
        counselorUserId: null,
        createdBy: "u-x",
        participantAId: "u-x",
        participantBId: null,
        pairingMode: "journey_invite",
      });
      const linked = await jsonStore.createJourney({
        coupleLinkId: "cl-x",
        programType: "premarital",
        status: "active",
        currentModuleId: "mod-01-knowing-yourself",
        counselorUserId: null,
        createdBy: "u-x",
        participantAId: "u-x",
        participantBId: "u-y",
        pairingMode: "spouse_link",
      });
      await jsonStore.saveResponse({
        id: "r1",
        journeyId: linked.id,
        moduleId: "mod-01-knowing-yourself",
        contentVersion: "v1",
        userId: "u-x",
        status: "submitted",
        answers: {},
        lastSavedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
      });
      const actives = await jsonStore.listActiveJourneysForUser("u-x");
      assert.ok(actives.some((j) => j.id === invite.id));
      assert.ok(actives.some((j) => j.id === linked.id));
      const hub = await resolveHubActiveJourneyForUser("u-x", actives);
      assert.equal(hub?.id, linked.id);
    }

    // Archive primary spouse journey hides older invite shell on hub
    {
      const shell = await jsonStore.createJourney({
        coupleLinkId: "",
        programType: "premarital",
        status: "active",
        currentModuleId: null,
        counselorUserId: null,
        createdBy: "u-p",
        participantAId: "u-p",
        participantBId: null,
        pairingMode: "journey_invite",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const primary = await jsonStore.createJourney({
        coupleLinkId: "cl-p",
        programType: "premarital",
        status: "active",
        currentModuleId: "mod-01-knowing-yourself",
        counselorUserId: "c-1",
        createdBy: "u-p",
        participantAId: "u-p",
        participantBId: "u-q",
        pairingMode: "spouse_link",
      });
      await jsonStore.saveResponse({
        id: "r-primary",
        journeyId: primary.id,
        moduleId: "mod-01-knowing-yourself",
        contentVersion: "v1",
        userId: "u-p",
        status: "submitted",
        answers: {},
        lastSavedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
      });
      await jsonStore.archiveJourneyData(primary.id);
      const actives = await jsonStore.listActiveJourneysForUser("u-p");
      assert.ok(actives.some((j) => j.id === shell.id));
      assert.ok(!actives.some((j) => j.id === primary.id));
      const hub = await resolveHubActiveJourneyForUser("u-p", actives);
      assert.equal(hub, null);
      await assert.rejects(
        () =>
          assertParticipantsMayStartNewJourney({
            participantUserIds: ["u-p"],
            coupleLinkId: "cl-after-archive",
          }),
        (err: Error) => err.message.includes("invitation-only"),
      );
    }

    // Another participant's archived journey does not suppress this user's invite shell
    {
      await jsonStore.createJourney({
        coupleLinkId: "",
        programType: "premarital",
        status: "active",
        currentModuleId: null,
        counselorUserId: null,
        createdBy: "u-only",
        participantAId: "u-only",
        participantBId: null,
        pairingMode: "journey_invite",
      });
      const otherArchived = await jsonStore.createJourney({
        coupleLinkId: "cl-other",
        programType: "premarital",
        status: "active",
        currentModuleId: null,
        counselorUserId: null,
        createdBy: "u-other",
        participantAId: "u-other",
        participantBId: "u-partner",
        pairingMode: "spouse_link",
      });
      await jsonStore.archiveJourneyData(otherArchived.id);
      const hub = await jsonStore.getActiveJourneyForUser("u-only");
      assert.ok(hub?.id);
      assert.equal(hub?.participantAId, "u-only");
    }

    // Stage 2 draft activity keeps invite journey legitimate (not abandoned)
    {
      const stage2Invite = await jsonStore.createJourney({
        coupleLinkId: "",
        programType: "premarital",
        status: "active",
        currentModuleId: "s2-temperament-discovery",
        counselorUserId: null,
        createdBy: "u-s2",
        participantAId: "u-s2",
        participantBId: null,
        pairingMode: "journey_invite",
      });
      await jsonStore.saveResponse({
        id: "r-s2-draft",
        journeyId: stage2Invite.id,
        moduleId: "s2-temperament-discovery",
        contentVersion: "stage2-2026.1",
        userId: "u-s2",
        status: "draft",
        answers: { note: "in progress" },
        lastSavedAt: new Date().toISOString(),
      });
      const engagement = await buildJourneyEngagement(stage2Invite);
      assert.equal(isAbandonedInviteShell(stage2Invite, engagement.meaningfulActivityCount), false);
      const hub = await jsonStore.getActiveJourneyForUser("u-s2");
      assert.equal(hub?.id, stage2Invite.id);
    }

    // Accept invite blocked when participant already has another active journey (hub-hidden or not)
    {
      const hostJourney = await jsonStore.createJourney({
        coupleLinkId: "",
        programType: "premarital",
        status: "active",
        currentModuleId: null,
        counselorUserId: null,
        createdBy: "u-host",
        participantAId: "u-host",
        participantBId: null,
        pairingMode: "journey_invite",
      });
      await jsonStore.createInvite({
        id: "mji-test-accept",
        code: "JOINCODE",
        journeyId: hostJourney.id,
        createdBy: "u-host",
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      });
      await jsonStore.createJourney({
        coupleLinkId: "cl-joiner",
        programType: "premarital",
        status: "active",
        currentModuleId: null,
        counselorUserId: null,
        createdBy: "u-joiner",
        participantAId: "u-joiner",
        participantBId: "u-spouse",
        pairingMode: "spouse_link",
      });
      await assert.rejects(
        () => acceptJourneyInvite(member("u-joiner"), "JOINCODE"),
        /already have an active counseling journey/,
      );
    }

    // Legitimate invite with submitted work remains visible
    {
      const legit = await jsonStore.createJourney({
        coupleLinkId: "",
        programType: "premarital",
        status: "active",
        currentModuleId: "mod-01-knowing-yourself",
        counselorUserId: null,
        createdBy: "u-inv",
        participantAId: "u-inv",
        participantBId: null,
        pairingMode: "journey_invite",
      });
      await jsonStore.saveResponse({
        id: "r-inv",
        journeyId: legit.id,
        moduleId: "mod-01-knowing-yourself",
        contentVersion: "v1",
        userId: "u-inv",
        status: "submitted",
        answers: {},
        lastSavedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
      });
      const hub = await jsonStore.getActiveJourneyForUser("u-inv");
      assert.equal(hub?.id, legit.id);
      assert.equal(isAbandonedInviteShell(legit, 1), false);
    }

    // Deterministic pick (engagement beats recency)
    {
      const older = await jsonStore.createJourney({
        coupleLinkId: "",
        programType: "premarital",
        status: "active",
        currentModuleId: null,
        counselorUserId: null,
        createdBy: "u-d",
        participantAId: "u-d",
        participantBId: "u-e",
        pairingMode: "journey_invite",
        createdAt: new Date(Date.now() - 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const newer = await jsonStore.createJourney({
        coupleLinkId: "",
        programType: "premarital",
        status: "active",
        currentModuleId: null,
        counselorUserId: null,
        createdBy: "u-d",
        participantAId: "u-d",
        participantBId: null,
        pairingMode: "journey_invite",
      });
      await jsonStore.saveResponse({
        id: "r-d",
        journeyId: older.id,
        moduleId: "mod-01-knowing-yourself",
        contentVersion: "v1",
        userId: "u-d",
        status: "submitted",
        answers: {},
        lastSavedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
      });
      const eOlder = await buildJourneyEngagement(older);
      const eNewer = await buildJourneyEngagement(newer);
      const picked = pickHubActiveJourneyFromEngagements([eNewer, eOlder]);
      assert.equal(picked?.id, older.id);
    }

    // Counselor authorization unchanged on active assigned journey
    {
      const j = await jsonStore.createJourney({
        coupleLinkId: "cl-c",
        programType: "premarital",
        status: "active",
        currentModuleId: null,
        counselorUserId: "c-1",
        createdBy: "u-c",
        participantAId: "u-c",
        participantBId: "u-d",
        pairingMode: "spouse_link",
      });
      await assertClinicalCounselorForJourney(member("c-1"), j);
    }

    console.log("marriage-active-journey-lifecycle.test.ts: OK");
  } finally {
    process.chdir(prev);
    rmSync(root, { recursive: true, force: true });
    delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
