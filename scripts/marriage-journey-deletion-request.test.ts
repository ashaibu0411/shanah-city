/**
 * Marriage Prep — participant deletion request + administrative review workflow.
 * Run: npx.cmd tsx scripts/marriage-journey-deletion-request.test.ts
 *
 * Uses one isolated env + dynamic imports so marriage-counseling-json picks up MARRIAGE_COUNSELING_DATA_FILE.
 */
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PublicMember } from "../src/lib/auth-types";

function member(id: string): PublicMember {
  return { id, name: id, email: `${id}@test.local`, role: "member" } as PublicMember;
}

function setupEnv(root: string) {
  const dataDir = join(root, "data");
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(
    join(dataDir, "pastoral-roles.json"),
    JSON.stringify({ seniorPastorUserId: "sp-1", associatePastorUserId: null }),
  );
  writeFileSync(join(dataDir, "groups.json"), JSON.stringify([]));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dataDir, "marriage-counseling.json");
  delete process.env.DATABASE_URL;
  delete process.env.MARRIAGE_E2E_ISOLATED;
  process.env.MARRIAGE_COUNSELOR_USER_IDS = "c-1";
  process.env.MARRIAGE_COUNSELOR_ASSIGNMENT_ADMIN_USER_IDS = "assign-admin";
}

async function main() {
  const root = mkdtempSync(join(tmpdir(), "mj-del-req-"));
  const prev = process.cwd();
  process.chdir(root);
  setupEnv(root);

  try {
    const jsonStore = await import("../src/lib/stores/marriage-counseling-json");
    const { requestJourneyDeletion, adminArchiveJourney, listJourneyAuditForCounselor } =
      await import("../src/lib/marriage-counseling-privacy-server");
    const {
      archiveJourneyAfterDeletionReview,
      dismissJourneyDeletionRequest,
      journeyHasPendingDeletionRequest,
      listPendingJourneyDeletionRequests,
    } = await import("../src/lib/marriage-deletion-request-admin");
    const { assertCounselorCanAccessJourneyOnDashboard } = await import(
      "../src/lib/marriage-counselor-dashboard"
    );
    const { getCounselorJourneyDetail } = await import(
      "../src/lib/marriage-counseling-counselor-server"
    );
    const { assertClinicalCounselorForJourney } = await import(
      "../src/lib/marriage-counseling-access"
    );

    async function createActiveJourney(counselorId = "c-1") {
      return jsonStore.createJourney({
        coupleLinkId: "",
        programType: "premarital",
        status: "active",
        currentModuleId: null,
        counselorUserId: counselorId,
        createdBy: "u-a",
        participantAId: "u-a",
        participantBId: "u-b",
      });
    }

    // Participant request + audit
    {
      const journey = await createActiveJourney();
      const result = await requestJourneyDeletion(member("u-a"), journey.id);
      assert.equal(result.ok, true);
      assert.match(String(result.message), /pastoral review/i);
      const updated = await jsonStore.getJourneyById(journey.id);
      assert.ok(updated?.deletionRequestedAt);
      assert.equal(journeyHasPendingDeletionRequest(updated), true);
      const logs = await jsonStore.listAuditLogs(journey.id);
      assert.ok(
        logs.some((l) => l.action === "journey_deletion_requested" && l.actorUserId === "u-a"),
      );
    }

    // Unauthorized participant
    {
      const journey = await createActiveJourney();
      await assert.rejects(
        () => requestJourneyDeletion(member("stranger"), journey.id),
        /You are not part of this journey/,
      );
    }

    // Pending visible to both partners
    {
      const journey = await createActiveJourney();
      await requestJourneyDeletion(member("u-a"), journey.id);
      const forB = await jsonStore.getJourneyById(journey.id);
      assert.equal(journeyHasPendingDeletionRequest(forB), true);
    }

    // Duplicate request idempotent
    {
      const journey = await createActiveJourney();
      await requestJourneyDeletion(member("u-a"), journey.id);
      const firstAt = (await jsonStore.getJourneyById(journey.id))?.deletionRequestedAt;
      const dup = await requestJourneyDeletion(member("u-b"), journey.id);
      assert.equal(dup.alreadyPending, true);
      assert.equal(firstAt, (await jsonStore.getJourneyById(journey.id))?.deletionRequestedAt);
      const logs = await jsonStore.listAuditLogs(journey.id);
      assert.equal(
        logs.filter((l) => l.action === "journey_deletion_requested").length,
        1,
      );
    }

    // Admin queue access
    {
      const journey = await createActiveJourney();
      await requestJourneyDeletion(member("u-a"), journey.id);
      await assert.rejects(
        () => listPendingJourneyDeletionRequests(member("c-1")),
        /Not authorized to review journey deletion requests/,
      );
      await assert.rejects(
        () => listPendingJourneyDeletionRequests(member("u-a")),
        /Not authorized to review journey deletion requests/,
      );
      const byAssignAdmin = await listPendingJourneyDeletionRequests(member("assign-admin"));
      assert.ok(byAssignAdmin.some((r) => r.journeyId === journey.id));
      const bySp = await listPendingJourneyDeletionRequests(member("sp-1"));
      assert.ok(bySp.some((r) => r.journeyId === journey.id));
    }

    // Counselor cannot archive
    {
      const journey = await createActiveJourney();
      await requestJourneyDeletion(member("u-a"), journey.id);
      await assert.rejects(
        () => adminArchiveJourney(member("c-1"), journey.id),
        /Not authorized to review journey deletion requests/,
      );
    }

    // Admin archive + audit
    {
      const journey = await createActiveJourney();
      await requestJourneyDeletion(member("u-a"), journey.id);
      await archiveJourneyAfterDeletionReview(member("sp-1"), journey.id);
      const archived = await jsonStore.getJourneyById(journey.id);
      assert.equal(archived?.status, "archived");
      const logs = await jsonStore.listAuditLogs(journey.id);
      const archivedLog = logs.find((l) => l.action === "journey_archived");
      assert.ok(archivedLog);
      assert.equal(archivedLog?.meta?.approvedByUserId, "sp-1");
      const queue = await listPendingJourneyDeletionRequests(member("sp-1"));
      assert.ok(!queue.some((r) => r.journeyId === journey.id));
    }

    // Admin dismiss
    {
      const journey = await createActiveJourney();
      await requestJourneyDeletion(member("u-a"), journey.id);
      await dismissJourneyDeletionRequest(member("assign-admin"), journey.id);
      const j = await jsonStore.getJourneyById(journey.id);
      assert.equal(j?.status, "active");
      assert.equal(j?.deletionRequestedAt, null);
      const logs = await jsonStore.listAuditLogs(journey.id);
      assert.ok(logs.some((l) => l.action === "journey_deletion_dismissed"));
    }

    // Archived clinical access denied
    {
      const journey = await createActiveJourney();
      await requestJourneyDeletion(member("u-a"), journey.id);
      await archiveJourneyAfterDeletionReview(member("sp-1"), journey.id);
      const archived = await jsonStore.getJourneyById(journey.id);
      assert.ok(archived);
      await assert.rejects(
        () => assertCounselorCanAccessJourneyOnDashboard(member("c-1"), archived!),
        /Access denied/,
      );
      await assert.rejects(
        () => getCounselorJourneyDetail(member("c-1"), journey.id),
        /Access denied/,
      );
    }

    // Active counselor consent + audit unchanged
    {
      const journey = await createActiveJourney();
      const j = await jsonStore.getJourneyById(journey.id);
      assert.ok(j);
      await assertClinicalCounselorForJourney(member("c-1"), j);
      const audit = await listJourneyAuditForCounselor(member("c-1"), journey.id);
      assert.ok(Array.isArray(audit));
    }

    console.log("marriage-journey-deletion-request.test.ts: OK");
  } finally {
    process.chdir(prev);
    rmSync(root, { recursive: true, force: true });
    delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
    delete process.env.MARRIAGE_COUNSELOR_USER_IDS;
    delete process.env.MARRIAGE_COUNSELOR_ASSIGNMENT_ADMIN_USER_IDS;
    delete process.env.DATABASE_URL;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
