/**
 * Phase 3M — counselor dashboard must not roster unassigned eligible counselors.
 * Run: npx.cmd tsx scripts/marriage-phase3m-counselor-dashboard-privacy.test.ts
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
  delete process.env.DIRECT_DATABASE_URL;
  delete process.env.MARRIAGE_E2E_ISOLATED;
  process.env.MARRIAGE_COUNSELOR_USER_IDS = "c-eligible,c-assigned,sp-pastor";
}

async function main() {
  const root = mkdtempSync(join(tmpdir(), "mc-dash-privacy-"));
  const prev = process.cwd();
  const prevDb = process.env.DATABASE_URL;
  const prevDirect = process.env.DIRECT_URL;
  const prevDirectDb = process.env.DIRECT_DATABASE_URL;
  const prevIso = process.env.MARRIAGE_E2E_ISOLATED;
  const prevDataFile = process.env.MARRIAGE_COUNSELING_DATA_FILE;
  process.chdir(root);
  setupEnv(root);

  try {
    const { useDatabase } = await import("../src/lib/use-database");
    assert.equal(useDatabase(), false, "JSON store tests must not route to PostgreSQL");

    const { MARRIAGE_COUNSELOR_ACCESS_DENIED } = await import(
      "../src/lib/marriage-counselor-api-security"
    );
    const {
      buildCounselorDashboardRows,
      listMarriageCounselorDashboardJourneys,
    } = await import("../src/lib/marriage-counselor-dashboard");
    const { getCounselorJourneyDetail } = await import(
      "../src/lib/marriage-counseling-counselor-server"
    );
    const { revokeCounselorAccess } = await import("../src/lib/marriage-counseling-privacy-server");
    const { listActiveJourneysForAssignmentAdminViewer } = await import(
      "../src/lib/marriage-journey-administrative-coordinator-server"
    );
    const { marriageStore } = await import("../src/lib/stores/marriage-counseling-store");
    const store = marriageStore();

    // Eligible counselor with zero assignments — empty dashboard
    await store.createJourney({
      coupleLinkId: "",
      programType: "premarital",
      status: "active",
      currentModuleId: null,
      counselorUserId: "c-assigned",
      createdBy: "u-a",
      participantAId: "u-a",
      participantBId: "u-b",
    });
    assert.equal((await listMarriageCounselorDashboardJourneys("c-eligible")).length, 0);
    assert.equal((await buildCounselorDashboardRows(member("c-eligible"))).length, 0);

    // Counselor with one assigned journey
    const mine = await store.createJourney({
      coupleLinkId: "",
      programType: "premarital",
      status: "active",
      currentModuleId: null,
      counselorUserId: "c-assigned",
      createdBy: "u-c",
      participantAId: "u-c",
      participantBId: "u-d",
    });
    await store.createJourney({
      coupleLinkId: "",
      programType: "premarital",
      status: "active",
      currentModuleId: null,
      counselorUserId: "other-c",
      createdBy: "u-x",
      participantAId: "u-x",
      participantBId: "u-y",
    });
    const assignedList = await listMarriageCounselorDashboardJourneys("c-assigned");
    assert.equal(assignedList.length, 2);
    assert.ok(assignedList.some((j) => j.id === mine.id));
    const assignedRows = await buildCounselorDashboardRows(member("c-assigned"));
    assert.equal(assignedRows.length, 2);
    assert.ok(assignedRows.every((r) => r.access === "clinical"));

    // Unrelated journey denied for unassigned eligible counselor
    const unrelated = await store.createJourney({
      coupleLinkId: "",
      programType: "premarital",
      status: "active",
      currentModuleId: null,
      counselorUserId: "other-c",
      createdBy: "u-e",
      participantAId: "u-e",
      participantBId: "u-f",
    });
    await assert.rejects(
      () => getCounselorJourneyDetail(member("c-eligible"), unrelated.id),
      (err: Error) => {
        assert.equal(err.message, MARRIAGE_COUNSELOR_ACCESS_DENIED);
        return true;
      },
    );

    // Senior Pastor assignment roster still lists all active journeys
    const spJourneys = await listActiveJourneysForAssignmentAdminViewer(member("sp-1"));
    assert.equal(spJourneys.length, 4);

    // Participant revocation removes counselor dashboard access
    const revokeTarget = await store.createJourney({
      coupleLinkId: "",
      programType: "premarital",
      status: "active",
      currentModuleId: null,
      counselorUserId: "c-assigned",
      createdBy: "u-r",
      participantAId: "u-r",
      participantBId: "u-s",
    });
    assert.equal((await buildCounselorDashboardRows(member("c-assigned"))).length, 3);
    await revokeCounselorAccess(member("u-r"), revokeTarget.id);
    assert.equal((await listMarriageCounselorDashboardJourneys("c-assigned")).length, 2);
    await assert.rejects(
      () => getCounselorJourneyDetail(member("c-assigned"), revokeTarget.id),
      (err: Error) => {
        assert.equal(err.message, MARRIAGE_COUNSELOR_ACCESS_DENIED);
        return true;
      },
    );

    // Assigned counselor without answer consent — clinical shell, no authorized answers
    const consentJourney = await store.createJourney({
      coupleLinkId: "",
      programType: "premarital",
      status: "active",
      currentModuleId: null,
      counselorUserId: "c-assigned",
      createdBy: "u-g",
      participantAId: "u-g",
      participantBId: "u-h",
    });
    const detail = await getCounselorJourneyDetail(member("c-assigned"), consentJourney.id);
    assert.equal(detail.access, "clinical");
    if (detail.access === "clinical") {
      assert.equal(detail.authorizedAnswers.length, 0);
    }

    console.log("marriage-phase3m-counselor-dashboard-privacy.test.ts: OK");
  } finally {
    process.chdir(prev);
    rmSync(root, { recursive: true, force: true });
    if (prevDb !== undefined) process.env.DATABASE_URL = prevDb;
    else delete process.env.DATABASE_URL;
    if (prevDirect !== undefined) process.env.DIRECT_URL = prevDirect;
    else delete process.env.DIRECT_URL;
    if (prevDirectDb !== undefined) process.env.DIRECT_DATABASE_URL = prevDirectDb;
    else delete process.env.DIRECT_DATABASE_URL;
    if (prevIso !== undefined) process.env.MARRIAGE_E2E_ISOLATED = prevIso;
    else delete process.env.MARRIAGE_E2E_ISOLATED;
    if (prevDataFile !== undefined) process.env.MARRIAGE_COUNSELING_DATA_FILE = prevDataFile;
    else delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
