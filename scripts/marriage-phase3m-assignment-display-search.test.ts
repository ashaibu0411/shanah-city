/**
 * Phase 3M — assignment admin labels + couple search (JSON store).
 * Run: npx.cmd tsx scripts/marriage-phase3m-assignment-display-search.test.ts
 */
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { MemberProfile, PublicMember } from "../src/lib/auth-types";
import { filterAdministrativeCoordinatorRoster } from "../src/lib/marriage-counselor-assignment-ui";
import { decodeAssignmentListCursor } from "../src/lib/marriage-counselor-assignment-list-pagination";

function member(id: string): PublicMember {
  return { id, name: id, email: `${id}@test.local`, role: "member" } as PublicMember;
}

function stubUser(
  id: string,
  input: { name: string; displayName?: string; email?: string },
): MemberProfile {
  const now = "2026-01-01T00:00:00.000Z";
  return {
    id,
    name: input.name,
    displayName: input.displayName,
    email: input.email ?? `${id}@test.local`,
    campusId: "campus-1",
    role: "member",
    passwordHash: "stub",
    family: [],
    createdAt: now,
    updatedAt: now,
  };
}

function setupEnv(root: string) {
  const dataDir = join(root, "data");
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(
    join(dataDir, "pastoral-roles.json"),
    JSON.stringify({ seniorPastorUserId: "sp-1", associatePastorUserId: null }),
  );
  writeFileSync(
    join(dataDir, "users.json"),
    JSON.stringify([
      stubUser("sp-1", { name: "Senior Pastor" }),
      stubUser("admin-a", { name: "Admin A" }),
      stubUser("admin-b", { name: "Admin B" }),
      stubUser("admin-display-only", { name: "   ", displayName: "Pat Coordinator" }),
      stubUser("counselor-visible", { name: "Hidden Legal", displayName: "Dr Searchable" }),
      stubUser("partner-a", { name: "   ", displayName: "River Lee" }),
      stubUser("partner-b", { name: "   ", displayName: "Sam Park" }),
    ] satisfies MemberProfile[]),
  );
  process.env.AUTH_DATA_DIR = dataDir;
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dataDir, "marriage-counseling.json");
  delete process.env.DATABASE_URL;
  delete process.env.DIRECT_URL;
  delete process.env.MARRIAGE_E2E_ISOLATED;
  process.env.MARRIAGE_COUNSELOR_ASSIGNMENT_ADMIN_USER_IDS =
    "admin-a,admin-b,admin-display-only,admin-missing";
}

function testCoordinatorRosterFiltersUnchanged() {
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
  testCoordinatorRosterFiltersUnchanged();

  const root = mkdtempSync(join(tmpdir(), "mcar-display-search-"));
  const prev = process.cwd();
  const prevAuth = process.env.AUTH_DATA_DIR;
  const prevDataFile = process.env.MARRIAGE_COUNSELING_DATA_FILE;
  const prevDb = process.env.DATABASE_URL;
  const prevIso = process.env.MARRIAGE_E2E_ISOLATED;
  const prevAdmins = process.env.MARRIAGE_COUNSELOR_ASSIGNMENT_ADMIN_USER_IDS;
  process.chdir(root);
  setupEnv(root);

  try {
    const { marriageStore } = await import("../src/lib/stores/marriage-counseling-store");
    const {
      listEligibleAssignmentAdmins,
      listCounselorAssignmentAdminJourneyRowsPaginated,
    } = await import("../src/lib/marriage-counselor-assignment-ui-server");
    const { resolveCoupleDisplayNames } = await import("../src/lib/marriage-counselor-journey-names");

    const admins = await listEligibleAssignmentAdmins(member("sp-1"));
    const displayOnly = admins.find((a) => a.userId === "admin-display-only");
    assert.ok(displayOnly, "display-only admin in list");
    assert.equal(displayOnly.displayName, "Pat Coordinator");
    assert.equal(displayOnly.userId, "admin-display-only");

    const missing = admins.find((a) => a.userId === "admin-missing");
    assert.ok(missing, "missing admin still allow-listed");
    assert.equal(missing.displayName, "Unknown member");
    assert.equal(missing.userId, "admin-missing");

    const store = marriageStore();
    await store.createJourney({
      id: "j-couple",
      coupleLinkId: "",
      programType: "premarital",
      status: "active",
      currentModuleId: null,
      counselorUserId: "counselor-visible",
      createdBy: "partner-a",
      participantAId: "partner-a",
      participantBId: "partner-b",
    });
    await store.createJourney({
      id: "j-other",
      coupleLinkId: "",
      programType: "premarital",
      status: "active",
      currentModuleId: null,
      counselorUserId: null,
      createdBy: "admin-a",
      participantAId: "admin-a",
      participantBId: "admin-b",
    });

    const journey = await store.getJourneyById("j-couple");
    assert.ok(journey);
    assert.equal(await resolveCoupleDisplayNames(journey), "River Lee & Sam Park");

    const listQuery = {
      limit: 25,
      cursor: null as ReturnType<typeof decodeAssignmentListCursor>,
      search: "",
      coordinatorFilter: "all" as const,
    };

    const allRows = await listCounselorAssignmentAdminJourneyRowsPaginated(member("sp-1"), listQuery);
    assert.equal(allRows.pageInfo.totalCount, 2);

    const byPartialName = await listCounselorAssignmentAdminJourneyRowsPaginated(member("sp-1"), {
      ...listQuery,
      search: "RIVER",
    });
    assert.equal(byPartialName.rows.length, 1);
    assert.equal(byPartialName.rows[0]?.journeyId, "j-couple");

    const byCounselor = await listCounselorAssignmentAdminJourneyRowsPaginated(member("sp-1"), {
      ...listQuery,
      search: "searchable",
    });
    assert.equal(byCounselor.rows.length, 1);
    assert.equal(byCounselor.rows[0]?.journeyId, "j-couple");
    assert.equal(byCounselor.rows[0]?.activeCounselorName, "Dr Searchable");

    const noMatch = await listCounselorAssignmentAdminJourneyRowsPaginated(member("sp-1"), {
      ...listQuery,
      search: "not-a-real-name",
    });
    assert.equal(noMatch.rows.length, 0);
    assert.equal(noMatch.pageInfo.totalCount, 0);

    const pageOne = await listCounselorAssignmentAdminJourneyRowsPaginated(member("sp-1"), {
      ...listQuery,
      limit: 1,
    });
    assert.equal(pageOne.rows.length, 1);
    assert.ok(pageOne.pageInfo.hasMore);
    const pageTwo = await listCounselorAssignmentAdminJourneyRowsPaginated(member("sp-1"), {
      ...listQuery,
      limit: 1,
      cursor: decodeAssignmentListCursor(pageOne.pageInfo.nextCursor),
    });
    assert.equal(pageTwo.rows.length, 1);
    assert.equal(pageOne.rows[0]?.journeyId !== pageTwo.rows[0]?.journeyId, true);

    console.log("marriage-phase3m-assignment-display-search.test.ts: all passed");
  } finally {
    process.chdir(prev);
    rmSync(root, { recursive: true, force: true });
    if (prevAuth !== undefined) process.env.AUTH_DATA_DIR = prevAuth;
    else delete process.env.AUTH_DATA_DIR;
    if (prevDataFile !== undefined) process.env.MARRIAGE_COUNSELING_DATA_FILE = prevDataFile;
    else delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
    if (prevDb !== undefined) process.env.DATABASE_URL = prevDb;
    else delete process.env.DATABASE_URL;
    if (prevIso !== undefined) process.env.MARRIAGE_E2E_ISOLATED = prevIso;
    else delete process.env.MARRIAGE_E2E_ISOLATED;
    if (prevAdmins !== undefined) process.env.MARRIAGE_COUNSELOR_ASSIGNMENT_ADMIN_USER_IDS = prevAdmins;
    else delete process.env.MARRIAGE_COUNSELOR_ASSIGNMENT_ADMIN_USER_IDS;
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
