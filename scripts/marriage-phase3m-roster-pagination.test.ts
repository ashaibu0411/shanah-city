/**
 * Phase 3M Step 2I — roster pagination completeness (JSON store).
 * Run: npx.cmd tsx scripts/marriage-phase3m-roster-pagination.test.ts
 */
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PublicMember } from "../src/lib/auth-types";
import {
  decodeAssignmentListCursor,
  encodeAssignmentListCursor,
} from "../src/lib/marriage-counselor-assignment-list-pagination";

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
  delete process.env.MARRIAGE_E2E_ISOLATED;
  process.env.MARRIAGE_COUNSELOR_ASSIGNMENT_ADMIN_USER_IDS = "admin-a,admin-b";
}

async function collectPaged<T>(
  fetchPage: (cursor: string | null) => Promise<{ rows: T[]; pageInfo: { nextCursor: string | null; totalCount: number; hasMore: boolean; allRecordsLoaded: boolean } }>,
): Promise<{ items: T[]; totalCount: number }> {
  const items: T[] = [];
  let cursor: string | null = null;
  let totalCount = 0;
  for (let pageNum = 0; pageNum < 50; pageNum++) {
    const page = await fetchPage(cursor);
    totalCount = page.pageInfo.totalCount;
    items.push(...page.rows);
    if (page.pageInfo.allRecordsLoaded || !page.pageInfo.nextCursor) break;
    cursor = page.pageInfo.nextCursor;
  }
  return { items, totalCount };
}

async function main() {
  const root = mkdtempSync(join(tmpdir(), "mcar-page-"));
  const prev = process.cwd();
  process.chdir(root);
  setupEnv(root);
  try {
    const { marriageStore } = await import("../src/lib/stores/marriage-counseling-store");
    const {
      listCounselorAssignmentAdminJourneyRowsPaginated,
      listSeniorPastorAdministrativeCoordinatorRosterPaginated,
      listSeniorPastorCounselorApprovalHistoryPaginated,
      listSeniorPastorCounselorApprovalQueuePaginated,
    } = await import("../src/lib/marriage-counselor-assignment-ui-server");
    const { assignAdministrativeCoordinator } = await import(
      "../src/lib/marriage-journey-administrative-coordinator-server"
    );

    const store = marriageStore();
    for (let i = 0; i < 120; i++) {
      const id = `j-${String(i).padStart(3, "0")}`;
      await store.createJourney({
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
      if (i % 2 === 0) {
        await assignAdministrativeCoordinator(member("sp-1"), {
          journeyId: id,
          coordinatorUserId: i % 4 === 0 ? "admin-a" : "admin-b",
        });
      }
    }

    for (let i = 0; i < 105; i++) {
      await store.saveCounselorAssignmentRequest({
        id: `req-p-${String(i).padStart(3, "0")}`,
        journeyId: `j-${String(i % 120).padStart(3, "0")}`,
        requestType: "assign",
        requestedCounselorUserId: "c-1",
        previousCounselorUserId: null,
        status: "pending",
        requestedByUserId: "admin-a",
        requestedAt: new Date(Date.UTC(2026, 0, 1, 0, i % 60, i)).toISOString(),
      });
    }

    for (let i = 0; i < 55; i++) {
      await store.saveCounselorAssignmentRequest({
        id: `req-h-${String(i).padStart(3, "0")}`,
        journeyId: `j-${String(i % 120).padStart(3, "0")}`,
        requestType: "assign",
        requestedCounselorUserId: "c-1",
        previousCounselorUserId: null,
        status: "executed",
        requestedByUserId: "admin-a",
        requestedAt: new Date(Date.UTC(2025, 6, 1, 0, 0, i)).toISOString(),
        reviewedAt: new Date(Date.UTC(2025, 6, 2, 0, 0, i)).toISOString(),
        executedAt: new Date(Date.UTC(2025, 6, 2, 1, 0, i)).toISOString(),
      });
    }

    const rosterAll = await collectPaged((cursor) =>
      listSeniorPastorAdministrativeCoordinatorRosterPaginated(member("sp-1"), {
        limit: 25,
        cursor: cursor ? decodeAssignmentListCursor(cursor) : null,
        search: "",
        coordinatorFilter: "all",
      }),
    );
    assert.equal(rosterAll.totalCount, 120);
    assert.equal(rosterAll.items.length, 120);
    assert.equal(new Set(rosterAll.items.map((r) => r.journeyId)).size, 120);

    const unassigned = await collectPaged((cursor) =>
      listSeniorPastorAdministrativeCoordinatorRosterPaginated(member("sp-1"), {
        limit: 25,
        cursor: cursor ? decodeAssignmentListCursor(cursor) : null,
        search: "",
        coordinatorFilter: "unassigned",
      }),
    );
    assert.equal(unassigned.totalCount, 60);
    assert.ok(unassigned.items.every((r) => !r.coordinatorUserId));

    const searchProgram = await collectPaged((cursor) =>
      listSeniorPastorAdministrativeCoordinatorRosterPaginated(member("sp-1"), {
        limit: 25,
        cursor: cursor ? decodeAssignmentListCursor(cursor) : null,
        search: "premarital",
        coordinatorFilter: "all",
      }),
    );
    assert.equal(searchProgram.totalCount, 120);

    const pageBeyond100 = await listSeniorPastorAdministrativeCoordinatorRosterPaginated(
      member("sp-1"),
      {
        limit: 25,
        cursor: decodeAssignmentListCursor(
          (
            await listSeniorPastorAdministrativeCoordinatorRosterPaginated(member("sp-1"), {
              limit: 25,
              cursor: null,
              search: "",
              coordinatorFilter: "all",
            })
          ).pageInfo.nextCursor!,
        ),
        search: "",
        coordinatorFilter: "all",
      },
    );
    assert.ok(pageBeyond100.rows.length > 0);
    assert.ok(pageBeyond100.pageInfo.totalCount === 120);

    const pendingAll = await collectPaged((cursor) =>
      listSeniorPastorCounselorApprovalQueuePaginated(member("sp-1"), {
        limit: 25,
        cursor: cursor ? decodeAssignmentListCursor(cursor) : null,
        search: "",
        coordinatorFilter: "all",
      }),
    );
    assert.equal(pendingAll.totalCount, 105);
    assert.equal(pendingAll.items.length, 105);
    assert.equal(new Set(pendingAll.items.map((r) => r.request.id)).size, 105);

    const historyAll = await collectPaged((cursor) =>
      listSeniorPastorCounselorApprovalHistoryPaginated(member("sp-1"), {
        limit: 10,
        cursor: cursor ? decodeAssignmentListCursor(cursor) : null,
        search: "",
        coordinatorFilter: "all",
      }),
    );
    assert.equal(historyAll.totalCount, 55);
    assert.equal(historyAll.items.length, 55);

    const adminA = await collectPaged((cursor) =>
      listCounselorAssignmentAdminJourneyRowsPaginated(member("admin-a"), {
        limit: 25,
        cursor: cursor ? decodeAssignmentListCursor(cursor) : null,
        search: "",
        coordinatorFilter: "all",
      }),
    );
    assert.equal(adminA.totalCount, 30);
    assert.equal(adminA.items.length, 30);
    assert.ok(adminA.items.every((r) => r.journeyId.startsWith("j-")));

    const adminB = await collectPaged((cursor) =>
      listCounselorAssignmentAdminJourneyRowsPaginated(member("admin-b"), {
        limit: 25,
        cursor: cursor ? decodeAssignmentListCursor(cursor) : null,
        search: "",
        coordinatorFilter: "all",
      }),
    );
    assert.equal(adminB.totalCount, 30);
    const overlap = adminA.items.some((a) => adminB.items.some((b) => b.journeyId === a.journeyId));
    assert.equal(overlap, false);

    await assert.rejects(
      () =>
        listCounselorAssignmentAdminJourneyRowsPaginated(member("stranger"), {
          limit: 25,
          cursor: null,
          search: "",
          coordinatorFilter: "all",
        }),
      /Not authorized/,
    );

    const leakProbe = JSON.stringify(rosterAll.items);
    assert.ok(!leakProbe.includes("answersJson"));
    assert.ok(!leakProbe.includes("phase3m-e2e-clinical-secret-marker"));

    assert.ok(decodeAssignmentListCursor(encodeAssignmentListCursor({ k: "a", id: "b" })));

    console.log("marriage-phase3m-roster-pagination.test.ts: all passed");
  } finally {
    process.chdir(prev);
    rmSync(root, { recursive: true, force: true });
    delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
  }
}

void main();
