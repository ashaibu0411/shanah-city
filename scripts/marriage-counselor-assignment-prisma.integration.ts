/**
 * Phase 3M Step 1A — counselor assignment approval concurrency (local PostgreSQL itest only).
 *
 *   $env:MARRIAGE_PRISMA_ITEST = "1"
 *   $env:MARRIAGE_COUNSELOR_USER_IDS = "p3m-c-old,p3m-c-new"
 *   $env:MARRIAGE_COUNSELOR_ASSIGNMENT_ADMIN_USER_IDS = "p3m-admin"
 *   $env:DATABASE_URL = "postgresql://USER:PASSWORD@127.0.0.1:5432/shanah_marriage_itest"
 *   npx.cmd tsx scripts/marriage-counselor-assignment-prisma.integration.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  fail,
  prepareProcessForPrismaIntegration,
  validateConfiguredDatabaseUrls,
  parsePostgresTarget,
  ITEST_REQUIRED,
} from "./marriage-itest-pg-target";

const ASSIGNMENT_MIGRATION = "20261020120000_marriage_counselor_assignment_approval";
const COORDINATOR_MIGRATION = "20261020130000_marriage_journey_administrative_coordinator";
const MOD = "mod-02-family-background";
const Q = "fb-sensitive";
/** Fictional itest Senior Pastor — written to PastoralRoleSlot when Prisma store is active. */
const TEST_SENIOR_PASTOR_USER_ID = "p3m-sp";
const TEST_JOURNEY_ID_PREFIX = "p3m-j-";

type TestResult = { id: string; pass: boolean; detail: string; concurrent?: boolean };

function member(id: string): import("../src/lib/auth-types").PublicMember {
  return { id, name: id, email: `${id}@test.local`, role: "member" } as import("../src/lib/auth-types").PublicMember;
}

function loadDatabaseUrlFromEnvLocalIfUnset() {
  if (process.env.DATABASE_URL?.trim()) return;
  const file = join(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.startsWith("DATABASE_URL=")) continue;
    const v = t.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
    try {
      parsePostgresTarget(v, ".env.local DATABASE_URL");
      process.env.DATABASE_URL = v;
      if (!process.env.DIRECT_URL?.trim()) process.env.DIRECT_URL = v;
      return;
    } catch {
      /* ignore */
    }
  }
}

type PastoralSlotSnapshot = {
  role: string;
  userId: string | null;
  updatedAt: Date;
  updatedBy: string | null;
  updatedByName: string | null;
};

async function snapshotPastoralRoleSlots(
  prisma: Awaited<ReturnType<typeof assertLiveLocalPostgresTarget>>,
): Promise<PastoralSlotSnapshot[]> {
  return prisma.pastoralRoleSlot.findMany({
    where: { role: { in: ["senior_pastor", "associate_pastor"] } },
  });
}

async function restorePastoralRoleSlots(
  prisma: Awaited<ReturnType<typeof assertLiveLocalPostgresTarget>>,
  snapshot: PastoralSlotSnapshot[],
) {
  for (const role of ["senior_pastor", "associate_pastor"] as const) {
    const saved = snapshot.find((row) => row.role === role);
    await prisma.pastoralRoleSlot.upsert({
      where: { role },
      create: {
        role,
        userId: saved?.userId ?? null,
        updatedAt: saved?.updatedAt ?? new Date(),
        updatedBy: saved?.updatedBy ?? null,
        updatedByName: saved?.updatedByName ?? null,
      },
      update: {
        userId: saved?.userId ?? null,
        updatedAt: saved?.updatedAt ?? new Date(),
        updatedBy: saved?.updatedBy ?? null,
        updatedByName: saved?.updatedByName ?? null,
      },
    });
  }
}

/** Prisma itest uses PastoralRoleSlot, not pastoral-roles.json (see pastoral-roles-server store()). */
async function seedItestSeniorPastorRole() {
  const pastoralRolesDb = await import("../src/lib/stores/pastoral-roles-db");
  await pastoralRolesDb.setPastoralRoleAssignment({
    role: "senior_pastor",
    userId: TEST_SENIOR_PASTOR_USER_ID,
    updatedBy: TEST_SENIOR_PASTOR_USER_ID,
    updatedByName: "Phase 3M assignment itest",
  });
}

async function assertItestSeniorPastorRecognized() {
  const { isSeniorPastor } = await import("../src/lib/marriage-counselor-assignment-authority");
  const ok = await isSeniorPastor(member(TEST_SENIOR_PASTOR_USER_ID));
  if (!ok) {
    fail(
      `itest fixture ${TEST_SENIOR_PASTOR_USER_ID} is not senior_pastor in PastoralRoleSlot (useDatabase pastoral store)`,
    );
  }
}

async function countItestAssignmentArtifacts(
  prisma: Awaited<ReturnType<typeof assertLiveLocalPostgresTarget>>,
) {
  const journeyFilter = { startsWith: TEST_JOURNEY_ID_PREFIX };
  const [journeys, requests, acks, revocations] = await Promise.all([
    prisma.marriageCounselingJourney.count({ where: { id: journeyFilter } }),
    prisma.marriageCounselorAssignmentRequest.count({
      where: { journeyId: journeyFilter },
    }),
    prisma.marriageCounselorAssignmentAcknowledgment.count({
      where: { journeyId: journeyFilter },
    }),
    prisma.marriageCounselorParticipantRevocation.count({
      where: { journeyId: journeyFilter },
    }),
  ]);
  return { journeys, requests, acks, revocations };
}

async function assertLiveLocalPostgresTarget() {
  const { prisma } = await import("../src/lib/db");
  const dbRows = await prisma.$queryRaw<Array<{ name: string | null }>>`
    SELECT current_database()::text AS name`;
  const liveName = dbRows[0]?.name?.trim();
  if (liveName !== ITEST_REQUIRED.REQUIRED_DATABASE) {
    fail(`current_database() is "${liveName}", expected "${ITEST_REQUIRED.REQUIRED_DATABASE}"`);
  }
  return prisma;
}

async function assertSchemaReady(prisma: Awaited<ReturnType<typeof assertLiveLocalPostgresTarget>>) {
  const migrations = await prisma.$queryRaw<
    Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>
  >`SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"`;
  const assignmentRow = migrations.find((m) => m.migration_name === ASSIGNMENT_MIGRATION);
  const coordinatorRow = migrations.find((m) => m.migration_name === COORDINATOR_MIGRATION);
  const assignmentReady = Boolean(assignmentRow?.finished_at && !assignmentRow.rolled_back_at);
  const coordinatorReady = Boolean(coordinatorRow?.finished_at && !coordinatorRow.rolled_back_at);
  const table = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'MarriageCounselorAssignmentRequest'
    ) AS exists`;
  const coordinatorTable = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'MarriageJourneyAdministrativeCoordinator'
    ) AS exists`;
  const ready =
    assignmentReady &&
    coordinatorReady &&
    table[0]?.exists === true &&
    coordinatorTable[0]?.exists === true;
  const missingMigration = !assignmentReady
    ? ASSIGNMENT_MIGRATION
    : !coordinatorReady
      ? COORDINATOR_MIGRATION
      : null;
  return { ready, missingMigration };
}

async function cleanupJourney(prisma: Awaited<ReturnType<typeof assertLiveLocalPostgresTarget>>, journeyId: string) {
  await prisma.marriageCounselorAssignmentAcknowledgment.deleteMany({ where: { journeyId } });
  await prisma.marriageCounselorParticipantRevocation.deleteMany({ where: { journeyId } });
  await prisma.marriageCounselorAssignmentRequest.deleteMany({ where: { journeyId } });
  await prisma.marriageAnswerChangeGeneration.deleteMany({ where: { journeyId } });
  await prisma.marriageSharingConsent.deleteMany({ where: { journeyId } });
  await prisma.marriageAuditLog.deleteMany({ where: { journeyId } });
  await prisma.marriageAssessmentResponse.deleteMany({ where: { journeyId } });
  await prisma.marriageJourneyAdministrativeCoordinator.deleteMany({ where: { journeyId } });
  await prisma.marriageCounselingJourney.deleteMany({ where: { id: journeyId } });
}

async function cleanupAllP3mTestJourneys(
  prisma: Awaited<ReturnType<typeof assertLiveLocalPostgresTarget>>,
) {
  const journeys = await prisma.marriageCounselingJourney.findMany({
    where: { id: { startsWith: TEST_JOURNEY_ID_PREFIX } },
    select: { id: true },
  });
  for (const { id } of journeys) {
    await cleanupJourney(prisma, id);
  }
}

function isRepeatAcknowledgmentRejection(error: unknown): boolean {
  return (
    error instanceof Error &&
    (/already active/i.test(error.message) ||
      /not awaiting participant authorization/i.test(error.message))
  );
}

async function setupJourney(runTag: string) {
  const { marriageStore } = await import("../src/lib/stores/marriage-counseling-store");
  const store = marriageStore();
  const journeyId = `p3m-j-${runTag}`;
  const uA = `p3m-u-a-${runTag}`;
  const uB = `p3m-u-b-${runTag}`;
  const cOld = "p3m-c-old";
  const cNew = "p3m-c-new";
  const now = new Date().toISOString();

  await store.createJourney({
    id: journeyId,
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: MOD,
    counselorUserId: cOld,
    createdBy: uA,
    participantAId: uA,
    participantBId: uB,
    guidedModuleIds: [MOD],
    curriculumVersion: "v1",
  });

  await store.saveResponse({
    id: `p3m-resp-a-${runTag}`,
    journeyId,
    moduleId: MOD,
    contentVersion: "v1",
    userId: uA,
    status: "submitted",
    answers: { [Q]: `p3m-private-${runTag}` },
    lastSavedAt: now,
    submittedAt: now,
  });

  const adminId =
    process.env.MARRIAGE_COUNSELOR_ASSIGNMENT_ADMIN_USER_IDS?.split(",")[0]?.trim() || "p3m-admin";
  const { assignAdministrativeCoordinator } = await import(
    "../src/lib/marriage-journey-administrative-coordinator-server"
  );
  await assignAdministrativeCoordinator(member(TEST_SENIOR_PASTOR_USER_ID), {
    journeyId,
    coordinatorUserId: adminId,
  });

  return { store, journeyId, uA, uB, cOld, cNew, now };
}

async function main() {
  if (!process.env.MARRIAGE_PRISMA_ITEST?.trim()) {
    process.env.MARRIAGE_PRISMA_ITEST = "1";
  }
  loadDatabaseUrlFromEnvLocalIfUnset();
  validateConfiguredDatabaseUrls();
  prepareProcessForPrismaIntegration();

  process.env.MARRIAGE_COUNSELOR_USER_IDS =
    process.env.MARRIAGE_COUNSELOR_USER_IDS?.trim() || "p3m-c-old,p3m-c-new";
  process.env.MARRIAGE_COUNSELOR_ASSIGNMENT_ADMIN_USER_IDS =
    process.env.MARRIAGE_COUNSELOR_ASSIGNMENT_ADMIN_USER_IDS?.trim() || "p3m-admin";

  const prisma = await assertLiveLocalPostgresTarget();
  const schema = await assertSchemaReady(prisma);
  if (!schema.ready) {
    console.log(
      JSON.stringify(
        {
          verdict: "BLOCKED",
          reason: "assignment approval migration not applied on itest DB",
          missingMigration: schema.missingMigration,
          hint: "Apply prisma migrations on 127.0.0.1/shanah_marriage_itest only",
        },
        null,
        2,
      ),
    );
    process.exit(2);
  }

  const pastoralSnapshot = await snapshotPastoralRoleSlots(prisma);
  await seedItestSeniorPastorRole();
  await assertItestSeniorPastorRecognized();
  await cleanupAllP3mTestJourneys(prisma);

  const {
    submitCounselorAssignmentRequest,
    approveCounselorAssignmentRequest,
    acknowledgeCounselorAssignmentRestoration,
  } = await import("../src/lib/marriage-counselor-assignment-request-server");
  const { revokeCounselorAccess } = await import("../src/lib/marriage-counseling-privacy-server");
  const { assertClinicalCounselorForJourney } = await import("../src/lib/marriage-counseling-access");
  const results: TestResult[] = [];
  const runTag = String(Date.now());
  let cleanup = { journeys: -1, requests: -1, acks: -1, revocations: -1 };

  async function ctxFresh(suffix: string) {
    const ctx = await setupJourney(`${runTag}-${suffix}`);
    return ctx;
  }

  async function withJourneyCleanup(journeyId: string, fn: () => Promise<void>) {
    try {
      await fn();
    } finally {
      await cleanupJourney(prisma, journeyId);
    }
  }

  try {
    // A — approve pending vs participant revoke (access invariant, not fixed race winner)
    {
      const ctx = await ctxFresh("a");
      await withJourneyCleanup(ctx.journeyId, async () => {
        const { request } = await submitCounselorAssignmentRequest(member("p3m-admin"), {
          journeyId: ctx.journeyId,
          counselorUserId: ctx.cNew,
          requestType: "reassign",
        });
        await Promise.allSettled([
          approveCounselorAssignmentRequest(member(TEST_SENIOR_PASTOR_USER_ID), {
            requestId: request.id,
          }),
          revokeCounselorAccess(member(ctx.uA), ctx.journeyId),
        ]);
        const j = await ctx.store.getJourneyById(ctx.journeyId);
        assert.ok(j);
        const reqRow = await prisma.marriageCounselorAssignmentRequest.findUnique({
          where: { id: request.id },
        });
        let newCounselorClinicalDenied = false;
        try {
          await assertClinicalCounselorForJourney(member(ctx.cNew), j);
        } catch {
          newCounselorClinicalDenied = true;
        }
        const revocationRecorded =
          (await prisma.marriageCounselorParticipantRevocation.count({
            where: { journeyId: ctx.journeyId, userId: ctx.uA },
          })) > 0;
        // Revocation must clear active assignee; requested counselor never retains clinical access.
        const pass =
          j.counselorUserId === null &&
          newCounselorClinicalDenied &&
          revocationRecorded &&
          j.counselorUserId !== ctx.cNew;
        results.push({
          id: "A",
          pass,
          detail: `status=${reqRow?.status} counselor=${j.counselorUserId} clinicalDenied=${newCounselorClinicalDenied} revocationRecorded=${revocationRecorded}`,
          concurrent: true,
        });
      });
    }

    // B — acknowledgment vs revoke on approved-not-executed
    {
      const ctx = await ctxFresh("b");
      await withJourneyCleanup(ctx.journeyId, async () => {
      await revokeCounselorAccess(member(ctx.uA), ctx.journeyId);
      const { request } = await submitCounselorAssignmentRequest(member("p3m-admin"), {
        journeyId: ctx.journeyId,
        counselorUserId: ctx.cNew,
        requestType: "assign",
      });
      const approved = await approveCounselorAssignmentRequest(member("p3m-sp"), {
        requestId: request.id,
      });
      assert.equal(approved.executed, false);
      const race = await Promise.allSettled([
        acknowledgeCounselorAssignmentRestoration(member(ctx.uA), { requestId: request.id }),
        revokeCounselorAccess(member(ctx.uA), ctx.journeyId),
      ]);
      const j = await ctx.store.getJourneyById(ctx.journeyId);
      const reqRow = await prisma.marriageCounselorAssignmentRequest.findUnique({
        where: { id: request.id },
      });
      const pass =
        j?.counselorUserId === null &&
        (reqRow?.status === "cancelled" || reqRow?.status === "approved");
      results.push({
        id: "B",
        pass: Boolean(pass),
        detail: `status=${reqRow?.status} counselor=${j?.counselorUserId}`,
        concurrent: true,
      });
      });
    }

    // C — two simultaneous Senior Pastor approvals
    {
      const ctx = await ctxFresh("c");
      await withJourneyCleanup(ctx.journeyId, async () => {
      const { request } = await submitCounselorAssignmentRequest(member("p3m-admin"), {
        journeyId: ctx.journeyId,
        counselorUserId: ctx.cNew,
        requestType: "reassign",
      });
      const race = await Promise.allSettled([
        approveCounselorAssignmentRequest(member("p3m-sp"), { requestId: request.id }),
        approveCounselorAssignmentRequest(member("p3m-sp"), { requestId: request.id }),
      ]);
      const fulfilled = race.filter((r) => r.status === "fulfilled").length;
      const rejected = race.filter((r) => r.status === "rejected").length;
      const reqRow = await prisma.marriageCounselorAssignmentRequest.findUnique({
        where: { id: request.id },
      });
      const pass = fulfilled === 1 && rejected === 1 && reqRow?.status !== "pending";
      results.push({
        id: "C",
        pass,
        detail: `fulfilled=${fulfilled} rejected=${rejected} status=${reqRow?.status}`,
        concurrent: true,
      });
      });
    }

    // D — reassignment execution vs consent grant
    {
      const ctx = await ctxFresh("d");
      await withJourneyCleanup(ctx.journeyId, async () => {
      const { request } = await submitCounselorAssignmentRequest(member("p3m-admin"), {
        journeyId: ctx.journeyId,
        counselorUserId: ctx.cNew,
        requestType: "reassign",
      });
      const {
        counselorConsentGrantVersionFromModuleStatus,
        grantCounselorAnswerConsent,
        listCounselorConsentStatusForModule,
      } = await import("../src/lib/marriage-counselor-consent-participant");
      const listed = counselorConsentGrantVersionFromModuleStatus(
        await listCounselorConsentStatusForModule(member(ctx.uA), ctx.journeyId, MOD),
        Q,
      );
      const race = await Promise.allSettled([
        approveCounselorAssignmentRequest(member("p3m-sp"), { requestId: request.id }),
        grantCounselorAnswerConsent(member(ctx.uA), ctx.journeyId, MOD, Q, listed),
      ]);
      const j = await ctx.store.getJourneyById(ctx.journeyId);
      assert.ok(j);
      const grantRejected =
        race[1].status === "rejected" &&
        race[1].reason instanceof Error &&
        /Counselor assignment does not match/i.test(race[1].reason.message);
      const { buildCounselorAuthorizedAnswerViews } = await import(
        "../src/lib/marriage-counselor-clinical-detail"
      );
      const viewsOld = await buildCounselorAuthorizedAnswerViews(member(ctx.cOld), j);
      const viewsNew = await buildCounselorAuthorizedAnswerViews(member(ctx.cNew), j);
      const oldRow = viewsOld.find((v) => v.userId === ctx.uA && v.questionId === Q);
      const newRow = viewsNew.find((v) => v.userId === ctx.uA && v.questionId === Q);
      const oldWithheld = Boolean(oldRow?.withheld);
      const newWithheld = Boolean(newRow?.withheld);
      const oldDisclosed = Boolean(oldRow && !oldRow.withheld && "answer" in oldRow);
      const newDisclosed = Boolean(newRow && !newRow.withheld && "answer" in newRow);
      const pass =
        j.counselorUserId === ctx.cNew &&
        newWithheld &&
        oldWithheld &&
        !oldDisclosed &&
        !newDisclosed &&
        (grantRejected || race[1].status === "fulfilled");
      results.push({
        id: "D",
        pass,
        detail: `counselor=${j.counselorUserId} grantRejected=${grantRejected} oldDisclosed=${oldDisclosed} newDisclosed=${newDisclosed}`,
        concurrent: true,
      });
      });
    }

    // E — stale assignment request (snapshot mismatch)
    {
      const ctx = await ctxFresh("e");
      await withJourneyCleanup(ctx.journeyId, async () => {
      const { request } = await submitCounselorAssignmentRequest(member("p3m-admin"), {
        journeyId: ctx.journeyId,
        counselorUserId: ctx.cNew,
        requestType: "reassign",
      });
      // Drift active counselor after submit (still c-old on request snapshot) — must not match reassign path.
      await prisma.marriageCounselingJourney.update({
        where: { id: ctx.journeyId },
        data: { counselorUserId: null },
      });
      let rejected = false;
      let approveError = "";
      try {
        await approveCounselorAssignmentRequest(member(TEST_SENIOR_PASTOR_USER_ID), {
          requestId: request.id,
        });
      } catch (e) {
        rejected = e instanceof Error && /changed since this request/i.test(e.message);
        approveError = e instanceof Error ? e.message : String(e);
      }
      const reqRow = await prisma.marriageCounselorAssignmentRequest.findUnique({
        where: { id: request.id },
      });
      const j = await ctx.store.getJourneyById(ctx.journeyId);
      const pass =
        rejected &&
        reqRow?.status === "pending" &&
        reqRow.executedAt === null &&
        j?.counselorUserId === null;
      results.push({
        id: "E",
        pass: Boolean(pass),
        detail: `rejected=${rejected} status=${reqRow?.status} counselor=${j?.counselorUserId} err=${approveError.slice(0, 80)}`,
      });
      });
    }

    // F — repeated acknowledgment (single ack row; second call rejected after activation)
    {
      const ctx = await ctxFresh("f");
      await withJourneyCleanup(ctx.journeyId, async () => {
      await revokeCounselorAccess(member(ctx.uA), ctx.journeyId);
      const { request } = await submitCounselorAssignmentRequest(member("p3m-admin"), {
        journeyId: ctx.journeyId,
        counselorUserId: ctx.cNew,
        requestType: "assign",
      });
      await approveCounselorAssignmentRequest(member(TEST_SENIOR_PASTOR_USER_ID), {
        requestId: request.id,
      });
      const first = await acknowledgeCounselorAssignmentRestoration(member(ctx.uA), {
        requestId: request.id,
      });
      const firstExecuted = first.executed === true;
      let secondRejected = false;
      try {
        await acknowledgeCounselorAssignmentRestoration(member(ctx.uA), { requestId: request.id });
      } catch (e) {
        secondRejected = isRepeatAcknowledgmentRejection(e);
      }
      const ackCount = await prisma.marriageCounselorAssignmentAcknowledgment.count({
        where: { requestId: request.id, userId: ctx.uA },
      });
      const j = await ctx.store.getJourneyById(ctx.journeyId);
      results.push({
        id: "F",
        pass:
          firstExecuted &&
          secondRejected &&
          ackCount === 1 &&
          j?.counselorUserId === ctx.cNew,
        detail: `firstExecuted=${firstExecuted} secondRejected=${secondRejected} ackCount=${ackCount} counselor=${j?.counselorUserId}`,
      });
      });
    }

    // G — approved-not-executed grants no clinical access to requested counselor
    {
      const ctx = await ctxFresh("g");
      await withJourneyCleanup(ctx.journeyId, async () => {
      await revokeCounselorAccess(member(ctx.uA), ctx.journeyId);
      const { request } = await submitCounselorAssignmentRequest(member("p3m-admin"), {
        journeyId: ctx.journeyId,
        counselorUserId: ctx.cNew,
        requestType: "assign",
      });
      await approveCounselorAssignmentRequest(member("p3m-sp"), { requestId: request.id });
      const j = await ctx.store.getJourneyById(ctx.journeyId);
      assert.ok(j);
      let denied = false;
      try {
        await assertClinicalCounselorForJourney(member(ctx.cNew), j);
      } catch {
        denied = true;
      }
      results.push({
        id: "G",
        pass: denied && j.counselorUserId === null,
        detail: `denied=${denied} activeCounselor=${j.counselorUserId}`,
      });
      });
    }

    cleanup = await countItestAssignmentArtifacts(prisma);
  } finally {
    await cleanupAllP3mTestJourneys(prisma);
    cleanup = await countItestAssignmentArtifacts(prisma);
    await restorePastoralRoleSlots(prisma, pastoralSnapshot);
    await prisma.$disconnect();
  }
  const failed = results.filter((r) => !r.pass);
  console.log(
    JSON.stringify(
      {
        verdict: failed.length ? "FAIL" : "PASS",
        database: ITEST_REQUIRED.REQUIRED_DATABASE,
        host: ITEST_REQUIRED.REQUIRED_HOST,
        seniorPastorFixture: TEST_SENIOR_PASTOR_USER_ID,
        realConcurrentTransactions: true,
        results,
        cleanup,
        cleanupOk:
          cleanup.journeys === 0 &&
          cleanup.requests === 0 &&
          cleanup.acks === 0 &&
          cleanup.revocations === 0,
      },
      null,
      2,
    ),
  );
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
