/**
 * Phase 3M Step 2B — administrative coordinator visibility (JSON store).
 * Run: npx.cmd tsx scripts/marriage-phase3m-admin-coordinator-visibility.test.ts
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
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dataDir, "marriage-counseling.json");
  delete process.env.DATABASE_URL;
  delete process.env.DIRECT_URL;
  delete process.env.MARRIAGE_E2E_ISOLATED;
  process.env.MARRIAGE_COUNSELOR_USER_IDS = "c-target";
  process.env.MARRIAGE_COUNSELOR_ASSIGNMENT_ADMIN_USER_IDS = "admin-a,admin-b";
}

async function main() {
  const root = mkdtempSync(join(tmpdir(), "mcar-coord-"));
  const prev = process.cwd();
  const prevDb = process.env.DATABASE_URL;
  const prevDirect = process.env.DIRECT_URL;
  const prevIso = process.env.MARRIAGE_E2E_ISOLATED;
  const prevDataFile = process.env.MARRIAGE_COUNSELING_DATA_FILE;
  process.chdir(root);
  setupEnv(root);

  try {
    const { marriageStore } = await import("../src/lib/stores/marriage-counseling-store");
    const {
      approveCounselorAssignmentRequest,
      submitCounselorAssignmentRequest,
      getCounselorAssignmentRequestStatus,
    } = await import("../src/lib/marriage-counselor-assignment-request-server");
    const { listCounselorAssignmentAdminJourneyRows } = await import(
      "../src/lib/marriage-counselor-assignment-ui-server"
    );
    const {
      assignAdministrativeCoordinator,
      listActiveJourneysForAssignmentAdminViewer,
    } = await import("../src/lib/marriage-journey-administrative-coordinator-server");
    const { buildCounselorAuthorizedAnswerViews } = await import(
      "../src/lib/marriage-counselor-clinical-detail"
    );

    const store = marriageStore();
    async function createJourney(id: string) {
      return store.createJourney({
        id,
        coupleLinkId: "",
        programType: "premarital",
        status: "active",
        currentModuleId: null,
        counselorUserId: null,
        createdBy: "u-a",
        participantAId: "u-a",
        participantBId: "u-b",
      });
    }

    await createJourney("j-one");
    await createJourney("j-two");
    await createJourney("j-unassigned");

    await assignAdministrativeCoordinator(member("sp-1"), {
      journeyId: "j-one",
      coordinatorUserId: "admin-a",
    });
    await assignAdministrativeCoordinator(member("sp-1"), {
      journeyId: "j-two",
      coordinatorUserId: "admin-b",
    });

    const spJourneys = await listActiveJourneysForAssignmentAdminViewer(member("sp-1"));
    assert.equal(spJourneys.length, 3, "SP sees all active journeys");

    const adminAJourneys = await listActiveJourneysForAssignmentAdminViewer(member("admin-a"));
    assert.deepEqual(
      adminAJourneys.map((j) => j.id).sort(),
      ["j-one"],
      "Admin A sees only assigned journey",
    );
    assert.ok(
      !adminAJourneys.some((j) => j.id === "j-unassigned"),
      "Unassigned couples invisible to admins",
    );

    const adminBRows = await listCounselorAssignmentAdminJourneyRows(member("admin-b"));
    assert.deepEqual(
      adminBRows.map((r) => r.journeyId).sort(),
      ["j-two"],
    );

    await assert.rejects(
      () => getCounselorAssignmentRequestStatus(member("admin-a"), "j-two"),
      /Not authorized for this couple/,
    );

    await assert.rejects(
      () =>
        submitCounselorAssignmentRequest(member("admin-a"), {
          journeyId: "j-two",
          counselorUserId: "c-target",
          requestType: "assign",
        }),
      /Not authorized for this couple/,
    );

    await assert.rejects(
      () =>
        assignAdministrativeCoordinator(member("admin-a"), {
          journeyId: "j-unassigned",
          coordinatorUserId: "admin-a",
        }),
      /Senior Pastor approval required/,
    );

    await assert.rejects(
      () =>
        assignAdministrativeCoordinator(member("sp-1"), {
          journeyId: "j-unassigned",
          coordinatorUserId: "not-on-allow-list",
        }),
      /not an authorized assignment admin/i,
    );

    const { request } = await submitCounselorAssignmentRequest(member("admin-a"), {
      journeyId: "j-one",
      counselorUserId: "c-target",
      requestType: "assign",
    });
    await approveCounselorAssignmentRequest(member("sp-1"), { requestId: request.id });

    const journey = await store.getJourneyById("j-one");
    assert.ok(journey);
    const views = await buildCounselorAuthorizedAnswerViews(member("admin-a"), journey);
    assert.ok(
      views.every((v) => v.withheld === true || !("answer" in v)),
      "admin has no clinical answers",
    );

    await assignAdministrativeCoordinator(member("sp-1"), {
      journeyId: "j-one",
      coordinatorUserId: "admin-b",
    });
    await assert.rejects(
      () => getCounselorAssignmentRequestStatus(member("admin-a"), "j-one"),
      /Not authorized for this couple/,
    );

    const adminBAfter = await listActiveJourneysForAssignmentAdminViewer(member("admin-b"));
    assert.ok(adminBAfter.some((j) => j.id === "j-one"));

    console.log("marriage-phase3m-admin-coordinator-visibility.test.ts: all passed");
  } finally {
    process.chdir(prev);
    rmSync(root, { recursive: true, force: true });
    if (prevDataFile !== undefined) process.env.MARRIAGE_COUNSELING_DATA_FILE = prevDataFile;
    else delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
    if (prevDb !== undefined) process.env.DATABASE_URL = prevDb;
    else delete process.env.DATABASE_URL;
    if (prevDirect !== undefined) process.env.DIRECT_URL = prevDirect;
    else delete process.env.DIRECT_URL;
    if (prevIso !== undefined) process.env.MARRIAGE_E2E_ISOLATED = prevIso;
    else delete process.env.MARRIAGE_E2E_ISOLATED;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
