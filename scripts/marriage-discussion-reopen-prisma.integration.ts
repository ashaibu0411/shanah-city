/**
 * Test 9L — Prisma/PostgreSQL integration (LOCAL disposable DB only).
 *
 * Prerequisites (operator — not run by this script):
 *   - PostgreSQL database named exactly `shanah_marriage_itest` on 127.0.0.1:5432 only
 *   - Migrations applied (including MarriageDiscussionMark.discussedAt)
 *   - Database must be empty: zero rows in every Marriage Counseling Hub Prisma table (see assertEmptyDisposableMarriageDatabase)
 *
 * Run (explicit env only — do NOT rely on .env / .env.local):
 *   $env:MARRIAGE_PRISMA_ITEST = "1"
 *   $env:DATABASE_URL = "postgresql://USER:PASSWORD@127.0.0.1:5432/shanah_marriage_itest"
 *   npx.cmd tsx scripts/marriage-discussion-reopen-prisma.integration.ts
 *
 * Never use staging/production Neon URLs. Never point at Test 9L staging rows.
 */
import assert from "node:assert/strict";

const REQUIRED_OPT_IN = "MARRIAGE_PRISMA_ITEST";
const REQUIRED_HOST = "127.0.0.1";
const REQUIRED_PORT = "5432";
const REQUIRED_DATABASE = "shanah_marriage_itest";

const REMOTE_HOST_DENY = [
  "neon.tech",
  "neon.database",
  "aws.neon",
  "supabase.co",
  "vercel",
  "amazonaws.com",
  "rds.amazonaws.com",
];

type ParsedPgTarget = { host: string; database: string; port: string; label: string };

function fail(message: string): never {
  throw new Error(`marriage-discussion-reopen-prisma.integration: ${message}`);
}

function parsePostgresTarget(raw: string, label: string): ParsedPgTarget {
  const trimmed = raw.trim();
  if (!/^postgres(ql)?:\/\//i.test(trimmed)) {
    fail(`${label} must use postgres:// or postgresql://`);
  }
  let url: URL;
  try {
    url = new URL(trimmed.replace(/^postgresql:/i, "http:").replace(/^postgres:/i, "http:"));
  } catch {
    fail(`${label} is not a valid URL`);
  }
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host === "::1") {
    fail(`${label} must use host ${REQUIRED_HOST} only (not localhost or ::1)`);
  }
  if (host !== REQUIRED_HOST) {
    fail(`${label} host must be exactly ${REQUIRED_HOST} (got ${url.hostname})`);
  }
  for (const fragment of REMOTE_HOST_DENY) {
    if (host.includes(fragment)) {
      fail(`${label} remote/cloud host pattern rejected (${fragment})`);
    }
  }
  const pathSegments = url.pathname.split("/").filter((segment) => segment.length > 0);
  if (pathSegments.length !== 1) {
    fail(
      `${label} pathname must be exactly /${REQUIRED_DATABASE} with no extra segments (got "${url.pathname}")`,
    );
  }
  const database = decodeURIComponent(pathSegments[0]!);
  if (database !== REQUIRED_DATABASE) {
    fail(`${label} database must be exactly "${REQUIRED_DATABASE}" (got "${database || "(empty)"}")`);
  }
  const port = url.port || REQUIRED_PORT;
  if (port !== REQUIRED_PORT) {
    fail(`${label} port must be exactly ${REQUIRED_PORT} (got ${port})`);
  }
  return { host, database, port, label };
}

function validateConfiguredDatabaseUrls(): ParsedPgTarget[] {
  if (process.env[REQUIRED_OPT_IN]?.trim() !== "1") {
    fail(`Set ${REQUIRED_OPT_IN}=1 to opt in to local Prisma integration writes`);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    fail("DATABASE_URL is required (pass explicitly in the shell; this script does not load .env files)");
  }

  const candidates: Array<{ value: string; label: string }> = [{ value: databaseUrl, label: "DATABASE_URL" }];
  for (const [label, key] of [
    ["DIRECT_URL", "DIRECT_URL"],
    ["DIRECT_DATABASE_URL", "DIRECT_DATABASE_URL"],
  ] as const) {
    const v = process.env[key]?.trim();
    if (v) candidates.push({ value: v, label });
  }

  const parsed = candidates.map((c) => parsePostgresTarget(c.value, c.label));
  const first = parsed[0]!;
  for (const p of parsed.slice(1)) {
    if (p.host !== first.host || p.database !== first.database || p.port !== first.port) {
      fail(
        `${p.label} target (${p.host}:${p.port}/${p.database}) must match DATABASE_URL (${first.host}:${first.port}/${first.database})`,
      );
    }
  }
  return parsed;
}

/** Block JSON fallback and isolated E2E before any store/prisma import. */
function prepareProcessForPrismaIntegration() {
  delete process.env.MARRIAGE_E2E_ISOLATED;
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
  delete process.env.MARRIAGE_CURRICULUM_DATA_FILE;
  delete process.env.AUTH_DATA_DIR;
  process.env.MARRIAGE_HUB_STAGE2_ENABLED = "1";
}

async function assertLiveLocalPostgresTarget() {
  const { prisma } = await import("../src/lib/db");

  const dbRows = await prisma.$queryRaw<Array<{ name: string | null }>>`
    SELECT current_database()::text AS name
  `;
  const liveName = dbRows[0]?.name?.trim();
  if (!liveName) {
    fail("Preflight: current_database() is NULL or empty");
  }
  if (liveName !== REQUIRED_DATABASE) {
    fail(
      `Preflight: current_database() is "${liveName}", expected exactly "${REQUIRED_DATABASE}"`,
    );
  }

  const addrRows = await prisma.$queryRaw<Array<{ server_host: string | null }>>`
    SELECT host(inet_server_addr()) AS server_host
  `;
  const serverHost = addrRows[0]?.server_host?.trim();
  if (!serverHost) {
    fail("Preflight: host(inet_server_addr()) is NULL or empty; cannot verify local PostgreSQL endpoint");
  }
  if (serverHost !== REQUIRED_HOST) {
    fail(`Preflight: host(inet_server_addr()) is "${serverHost}", expected exactly ${REQUIRED_HOST}`);
  }

  return prisma;
}

type IntegrationPrisma = Awaited<ReturnType<typeof assertLiveLocalPostgresTarget>>;

/**
 * Fail closed unless every Marriage Counseling Hub table is empty (disposable itest DB only).
 * Required before curriculum publish, which archives any existing published curriculum versions.
 */
async function assertEmptyDisposableMarriageDatabase(prisma: IntegrationPrisma) {
  const tableChecks: Array<{ model: string; count: () => Promise<number> }> = [
    { model: "MarriageCounselingJourney", count: () => prisma.marriageCounselingJourney.count() },
    { model: "MarriageJourneyConsent", count: () => prisma.marriageJourneyConsent.count() },
    { model: "MarriageAssessmentResponse", count: () => prisma.marriageAssessmentResponse.count() },
    { model: "MarriageComparisonUnlock", count: () => prisma.marriageComparisonUnlock.count() },
    { model: "MarriageJournalEntry", count: () => prisma.marriageJournalEntry.count() },
    { model: "MarriageCounselingSession", count: () => prisma.marriageCounselingSession.count() },
    { model: "MarriageCounselorAssignment", count: () => prisma.marriageCounselorAssignment.count() },
    { model: "MarriageJourneyInvite", count: () => prisma.marriageJourneyInvite.count() },
    { model: "MarriageRevisionRequest", count: () => prisma.marriageRevisionRequest.count() },
    { model: "MarriageAuditLog", count: () => prisma.marriageAuditLog.count() },
    { model: "MarriageDiscussionMark", count: () => prisma.marriageDiscussionMark.count() },
    { model: "MarriageCounselorNote", count: () => prisma.marriageCounselorNote.count() },
    { model: "MarriageCurriculumVersion", count: () => prisma.marriageCurriculumVersion.count() },
    { model: "MarriageProgramTrack", count: () => prisma.marriageProgramTrack.count() },
    { model: "MarriageActionPlan", count: () => prisma.marriageActionPlan.count() },
    { model: "MarriageSharedGoal", count: () => prisma.marriageSharedGoal.count() },
    { model: "MarriageSharingConsent", count: () => prisma.marriageSharingConsent.count() },
    { model: "MarriageActivitySyncSession", count: () => prisma.marriageActivitySyncSession.count() },
  ];

  const results = await Promise.all(
    tableChecks.map(async ({ model, count }) => ({ model, rows: await count() })),
  );
  const nonEmpty = results.filter((r) => r.rows > 0);
  if (nonEmpty.length > 0) {
    const detail = nonEmpty.map((r) => `${r.model} (${r.rows})`).join(", ");
    fail(
      `Marriage Counseling Hub tables must be empty before integration writes; found row(s) in: ${detail}. Use a disposable ${REQUIRED_DATABASE} database.`,
    );
  }
}

async function assertPrismaStoreActive() {
  if (process.env.MARRIAGE_E2E_ISOLATED === "1") {
    fail("MARRIAGE_E2E_ISOLATED must not be set (JSON fallback must stay disabled)");
  }
  if (process.env.MARRIAGE_COUNSELING_DATA_FILE?.trim()) {
    fail("MARRIAGE_COUNSELING_DATA_FILE must not be set (JSON fallback must stay disabled)");
  }
  if (process.env.MARRIAGE_CURRICULUM_DATA_FILE?.trim()) {
    fail("MARRIAGE_CURRICULUM_DATA_FILE must not be set (JSON fallback must stay disabled)");
  }

  const { useDatabase } = await import("../src/lib/use-database");
  assert.equal(useDatabase(), true, "DATABASE_URL must enable the Prisma marriage store");

  const { marriageStore } = await import("../src/lib/stores/marriage-counseling-store");
  const dbStore = await import("../src/lib/stores/marriage-counseling-db");
  const store = marriageStore();
  assert.equal(
    store.createJourney,
    dbStore.createJourney,
    "marriageStore must delegate createJourney to Prisma db module",
  );
  assert.equal(
    store.getDiscussionMarks,
    dbStore.getDiscussionMarks,
    "marriageStore must delegate getDiscussionMarks to Prisma db module",
  );
}

type NoteSnap = { author: string; body: string; id: string; discussedAt: string | null };

function snapNotesFromComparison(item: {
  discussion?: {
    sharedNotes: Array<{ authorUserId: string; body: string; markedAt: string }>;
  };
}): Array<{ author: string; body: string }> {
  return (item.discussion?.sharedNotes ?? [])
    .map((n) => ({ author: n.authorUserId, body: n.body }))
    .sort((a, b) => a.author.localeCompare(b.author));
}

async function cleanupSyntheticJourney(
  prisma: IntegrationPrisma,
  journeyId: string,
  curriculumVersionId: string,
) {
  await prisma.marriageAuditLog.deleteMany({ where: { journeyId } });
  await prisma.marriageDiscussionMark.deleteMany({ where: { journeyId } });
  await prisma.marriageComparisonUnlock.deleteMany({ where: { journeyId } });
  await prisma.marriageAssessmentResponse.deleteMany({ where: { journeyId } });
  await prisma.marriageJourneyConsent.deleteMany({ where: { journeyId } });
  await prisma.marriageCounselingJourney.deleteMany({ where: { id: journeyId } });
  await prisma.marriageCurriculumVersion.deleteMany({ where: { id: curriculumVersionId } });
}

async function run() {
  validateConfiguredDatabaseUrls();
  prepareProcessForPrismaIntegration();

  let prisma: IntegrationPrisma | undefined;
  try {
    prisma = await assertLiveLocalPostgresTarget();
    await assertEmptyDisposableMarriageDatabase(prisma);
    await assertPrismaStoreActive();

    const { marriageStore } = await import("../src/lib/stores/marriage-counseling-store");
    const { marriageCurriculumStore } = await import("../src/lib/stores/marriage-curriculum-store");
    const { freezeStage2ModulesIntoSnapshot } = await import("../src/lib/marriage-curriculum-stage2-merge");
    const { MARRIAGE_CONSENT_VERSION } = await import("../src/lib/marriage-counseling-curriculum");
    const {
      markDiscussion,
      saveDiscussionNote,
      reopenDiscussion,
      getComparisonForViewer,
    } = await import("../src/lib/marriage-counseling-server");

    const store = marriageStore();
    const curriculum = marriageCurriculumStore();

    const runTag = `itest9l-${Date.now()}`;
    const journeyId = `mj-${runTag}`;
    const curriculumVersionId = `mcv-${runTag}`;
    const userAId = `itest-u-a-${runTag}`;
    const userBId = `itest-u-b-${runTag}`;
    const NOTE_A = `9L-prisma-partner-a-${runTag}`;
    const NOTE_B = `9L-prisma-partner-b-${runTag}`;

    const MOD = "s2-temperament-discovery";
    const Q = "m01-soc-1";
    const now = new Date().toISOString();
    const userA = { id: userAId, name: "ITest Partner A" } as import("../src/lib/auth-types").PublicMember;
    const userB = { id: userBId, name: "ITest Partner B" } as import("../src/lib/auth-types").PublicMember;

    let cleaned = false;
    try {
    const draft = await curriculum.saveCurriculumDraft({
      id: curriculumVersionId,
      version: `itest-cv-${runTag}`,
      modules: freezeStage2ModulesIntoSnapshot([]),
      createdBy: "itest-admin",
      createdByName: "ITest Admin",
    });
    const published = await curriculum.publishCurriculumVersion(draft.id, "itest-admin", "ITest Admin");

    await store.createJourney({
      id: journeyId,
      coupleLinkId: "",
      programType: "premarital",
      status: "active",
      currentModuleId: MOD,
      counselorUserId: null,
      createdBy: userAId,
      pairingMode: "journey_invite",
      participantAId: userAId,
      participantBId: userBId,
      curriculumVersion: published.version,
    });

    for (const uid of [userAId, userBId]) {
      await store.upsertConsent({
        journeyId,
        userId: uid,
        consentVersion: MARRIAGE_CONSENT_VERSION,
        consentedAt: now,
      });
    }

    const answersA = { [Q]: "4", "m01-reflect-hopes": `private-a-${runTag}` };
    const answersB = { [Q]: "2", "m01-reflect-hopes": `private-b-${runTag}` };

    await store.saveResponse({
      id: `mr-a-${runTag}`,
      journeyId,
      moduleId: MOD,
      contentVersion: published.version,
      userId: userAId,
      status: "submitted",
      answers: answersA,
      lastSavedAt: now,
      submittedAt: now,
    });
    await store.saveResponse({
      id: `mr-b-${runTag}`,
      journeyId,
      moduleId: MOD,
      contentVersion: published.version,
      userId: userBId,
      status: "submitted",
      answers: answersB,
      lastSavedAt: now,
      submittedAt: now,
    });
    await store.createUnlock({
      journeyId,
      moduleId: MOD,
      contentVersion: published.version,
      unlockedAt: now,
    });

    const answersBeforeA = JSON.stringify((await store.getResponse(journeyId, MOD, userAId))!.answers);
    const answersBeforeB = JSON.stringify((await store.getResponse(journeyId, MOD, userBId))!.answers);

    await markDiscussion(userA, MOD, Q);
    await saveDiscussionNote(userA, MOD, Q, NOTE_A);
    await saveDiscussionNote(userB, MOD, Q, NOTE_B);

    let cmpA = await getComparisonForViewer(userA, MOD);
    let cmpB = await getComparisonForViewer(userB, MOD);
    let itemA = cmpA.items.find((i) => i.questionId === Q)!;
    let itemB = cmpB.items.find((i) => i.questionId === Q)!;
    assert.equal(itemA.discussion?.discussed, true);
    assert.equal(itemB.discussion?.discussed, true);

    const expectedNotes = [
      { author: userAId, body: NOTE_A },
      { author: userBId, body: NOTE_B },
    ];
    assert.deepEqual(snapNotesFromComparison(itemA), expectedNotes);
    assert.deepEqual(snapNotesFromComparison(itemB), expectedNotes);

    let dbMarks = await prisma.marriageDiscussionMark.findMany({
      where: { journeyId, moduleId: MOD, questionId: Q },
      orderBy: { markedByUserId: "asc" },
    });
    assert.equal(dbMarks.length, 2, "two discussion mark rows in PostgreSQL");
    const rowSnapBeforeReopen: NoteSnap[] = dbMarks.map((r) => ({
      author: r.markedByUserId,
      body: r.sharedNote ?? "",
      id: r.id,
      discussedAt: r.discussedAt ? r.discussedAt.toISOString() : null,
    }));
    assert.equal(rowSnapBeforeReopen.find((r) => r.author === userAId)?.body, NOTE_A);
    assert.equal(rowSnapBeforeReopen.find((r) => r.author === userBId)?.body, NOTE_B);
    assert.ok(rowSnapBeforeReopen.every((r) => r.discussedAt !== null), "discussedAt set before reopen");

    await reopenDiscussion(userB, MOD, Q);

    cmpA = await getComparisonForViewer(userA, MOD);
    cmpB = await getComparisonForViewer(userB, MOD);
    itemA = cmpA.items.find((i) => i.questionId === Q)!;
    itemB = cmpB.items.find((i) => i.questionId === Q)!;
    assert.equal(itemA.discussion?.discussed, false, "Partner A comparison: discussed cleared");
    assert.equal(itemB.discussion?.discussed, false, "Partner B comparison: discussed cleared");
    assert.deepEqual(snapNotesFromComparison(itemA), expectedNotes, "Partner A notes after reopen");
    assert.deepEqual(snapNotesFromComparison(itemB), expectedNotes, "Partner B notes after reopen");

    const freshRows = await prisma.$queryRaw<
      Array<{ id: string; markedByUserId: string; sharedNote: string | null; discussedAt: Date | null }>
    >`
      SELECT id, "markedByUserId", "sharedNote", "discussedAt"
      FROM "MarriageDiscussionMark"
      WHERE "journeyId" = ${journeyId}
        AND "moduleId" = ${MOD}
        AND "questionId" = ${Q}
      ORDER BY "markedByUserId" ASC
    `;
    assert.equal(freshRows.length, 2, "fresh SQL read: two rows");
    for (const before of rowSnapBeforeReopen) {
      const row = freshRows.find((r) => r.markedByUserId === before.author);
      assert.ok(row, `fresh read missing row for ${before.author}`);
      assert.equal(row!.id, before.id, "row id stable after reopen");
      assert.equal(row!.sharedNote, before.body, "sharedNote text unchanged after reopen");
      assert.equal(row!.discussedAt, null, "discussedAt null after reopen");
    }

    const marksViaStore = await store.getDiscussionMarks(journeyId, MOD);
    const qMarks = marksViaStore.filter((m) => m.questionId === Q);
    assert.equal(qMarks.length, 2);
    for (const before of rowSnapBeforeReopen) {
      const m = qMarks.find((x) => x.markedByUserId === before.author)!;
      assert.equal(m.id, before.id);
      assert.equal(m.sharedNote, before.body);
      assert.equal(m.discussedAt, null);
    }

    cmpA = await getComparisonForViewer(userA, MOD);
    itemA = cmpA.items.find((i) => i.questionId === Q)!;
    assert.deepEqual(snapNotesFromComparison(itemA), expectedNotes, "second comparison fetch for A");

    cmpB = await getComparisonForViewer(userB, MOD);
    itemB = cmpB.items.find((i) => i.questionId === Q)!;
    assert.deepEqual(snapNotesFromComparison(itemB), expectedNotes, "second comparison fetch for B");

    assert.equal(
      JSON.stringify((await store.getResponse(journeyId, MOD, userAId))!.answers),
      answersBeforeA,
      "Partner A assessment answers unchanged",
    );
    assert.equal(
      JSON.stringify((await store.getResponse(journeyId, MOD, userBId))!.answers),
      answersBeforeB,
      "Partner B assessment answers unchanged",
    );

    console.log("marriage-discussion-reopen-prisma.integration.ts: OK");
    } finally {
      if (!cleaned) {
        await cleanupSyntheticJourney(prisma, journeyId, curriculumVersionId);
        cleaned = true;
      }
    }
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
