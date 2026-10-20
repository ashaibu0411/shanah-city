/**
 * Phase 3M Step 2D — coordinator management UI server + permission helpers.
 * Run: npx.cmd tsx scripts/marriage-phase3m-coordinator-ui.test.ts
 */
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PublicMember } from "../src/lib/auth-types";
import {
  counselorAssignmentUiCapabilities,
  filterAdministrativeCoordinatorRoster,
} from "../src/lib/marriage-counselor-assignment-ui";

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
  process.env.MARRIAGE_COUNSELOR_ASSIGNMENT_ADMIN_USER_IDS = "admin-a,admin-b";
}

function testUiCapabilities() {
  const sp = counselorAssignmentUiCapabilities({
    canSubmitRequest: true,
    canApprove: true,
    canAcknowledgeRestoration: false,
  });
  assert.equal(sp.showCoordinatorManagement, true);
  assert.equal(sp.showApproveActions, true);

  const admin = counselorAssignmentUiCapabilities({
    canSubmitRequest: true,
    canApprove: false,
    canAcknowledgeRestoration: false,
  });
  assert.equal(admin.showCoordinatorManagement, false);
  assert.equal(admin.showSubmitActions, true);
}

function testRosterFilter() {
  const rows = [
    {
      journeyId: "j1",
      coupleNames: "Alex & Bailey",
      programType: "premarital",
      coordinatorUserId: "admin-a",
      coordinatorName: "Admin A",
      assignedAt: "2026-01-01T00:00:00.000Z",
      assignedByUserId: "sp-1",
      assignedByName: "Senior Pastor",
    },
    {
      journeyId: "j2",
      coupleNames: "Chris & Dana",
      programType: "premarital",
      coordinatorUserId: null,
      coordinatorName: null,
      assignedAt: null,
      assignedByUserId: null,
      assignedByName: null,
    },
  ];
  assert.equal(
    filterAdministrativeCoordinatorRoster(rows, { search: "", assignment: "unassigned" }).length,
    1,
  );
  assert.equal(
    filterAdministrativeCoordinatorRoster(rows, { search: "bailey", assignment: "all" }).length,
    1,
  );
}

async function main() {
  testUiCapabilities();
  testRosterFilter();

  const root = mkdtempSync(join(tmpdir(), "mcar-coord-ui-"));
  const prev = process.cwd();
  const prevDataFile = process.env.MARRIAGE_COUNSELING_DATA_FILE;
  const prevDb = process.env.DATABASE_URL;
  const prevIso = process.env.MARRIAGE_E2E_ISOLATED;
  process.chdir(root);
  setupEnv(root);

  try {
    const { marriageStore } = await import("../src/lib/stores/marriage-counseling-store");
    const {
      listEligibleAssignmentAdmins,
      listSeniorPastorAdministrativeCoordinatorRoster,
    } = await import("../src/lib/marriage-counselor-assignment-ui-server");
    const { assignAdministrativeCoordinator } = await import(
      "../src/lib/marriage-journey-administrative-coordinator-server"
    );
    const { listCounselorAssignmentAdminJourneyRows } = await import(
      "../src/lib/marriage-counselor-assignment-ui-server"
    );

    const store = marriageStore();
    await store.createJourney({
      id: "j-one",
      coupleLinkId: "",
      programType: "premarital",
      status: "active",
      currentModuleId: null,
      counselorUserId: null,
      createdBy: "u-a",
      participantAId: "u-a",
      participantBId: "u-b",
    });
    await store.createJourney({
      id: "j-two",
      coupleLinkId: "",
      programType: "premarital",
      status: "active",
      currentModuleId: null,
      counselorUserId: null,
      createdBy: "u-c",
      participantAId: "u-c",
      participantBId: "u-d",
    });

    await assert.rejects(
      () => listSeniorPastorAdministrativeCoordinatorRoster(member("admin-a")),
      /Senior Pastor approval required/,
    );
    await assert.rejects(
      () => listEligibleAssignmentAdmins(member("admin-a")),
      /Senior Pastor approval required/,
    );

    const admins = await listEligibleAssignmentAdmins(member("sp-1"));
    assert.deepEqual(
      admins.map((a) => a.userId).sort(),
      ["admin-a", "admin-b"],
    );
    assert.ok(!admins.some((a) => a.userId === "sp-1"), "SP excluded from self-assign list");

    let roster = await listSeniorPastorAdministrativeCoordinatorRoster(member("sp-1"));
    assert.equal(roster.length, 2);
    assert.ok(roster.every((r) => !r.coordinatorUserId));

    await assignAdministrativeCoordinator(member("sp-1"), {
      journeyId: "j-one",
      coordinatorUserId: "admin-a",
    });
    roster = await listSeniorPastorAdministrativeCoordinatorRoster(member("sp-1"));
    const j1 = roster.find((r) => r.journeyId === "j-one");
    assert.equal(j1?.coordinatorUserId, "admin-a");
    assert.equal(j1?.assignedByUserId, "sp-1");
    assert.ok(j1?.assignedAt);

    let adminRows = await listCounselorAssignmentAdminJourneyRows(member("admin-a"));
    assert.deepEqual(
      adminRows.map((r) => r.journeyId),
      ["j-one"],
    );

    await assignAdministrativeCoordinator(member("sp-1"), {
      journeyId: "j-one",
      coordinatorUserId: "admin-b",
    });
    adminRows = await listCounselorAssignmentAdminJourneyRows(member("admin-a"));
    assert.equal(adminRows.length, 0, "previous admin loses roster access after reassignment");
    adminRows = await listCounselorAssignmentAdminJourneyRows(member("admin-b"));
    assert.deepEqual(
      adminRows.map((r) => r.journeyId),
      ["j-one"],
    );

    console.log("marriage-phase3m-coordinator-ui.test.ts: all passed");
  } finally {
    process.chdir(prev);
    rmSync(root, { recursive: true, force: true });
    if (prevDataFile !== undefined) process.env.MARRIAGE_COUNSELING_DATA_FILE = prevDataFile;
    else delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
    if (prevDb !== undefined) process.env.DATABASE_URL = prevDb;
    else delete process.env.DATABASE_URL;
    if (prevIso !== undefined) process.env.MARRIAGE_E2E_ISOLATED = prevIso;
    else delete process.env.MARRIAGE_E2E_ISOLATED;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
