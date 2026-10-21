/**
 * Phase 3E/3F — counselor consent privacy + version binding on local PostgreSQL (shanah_marriage_itest only).
 * Tests A–K: privacy/concurrency; L–M: participant consent-version binding (deterministic).
 *
 * Run (explicit env — never .env.staging.local):
 *   $env:MARRIAGE_PRISMA_ITEST = "1"
 *   $env:MARRIAGE_COUNSELOR_USER_IDS = "p3e-c-a,p3e-c-b,p3e-pastor"
 *   $env:DATABASE_URL = "postgresql://USER:PASSWORD@127.0.0.1:5432/shanah_marriage_itest"
 *   $env:DIRECT_URL = $env:DATABASE_URL
 *   npx.cmd tsx scripts/marriage-counselor-consent-prisma.integration.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  fail,
  prepareProcessForPrismaIntegration,
  validateConfiguredDatabaseUrls,
  parsePostgresTarget,
  ITEST_REQUIRED,
} from "./marriage-itest-pg-target";

const PENDING_MIGRATIONS = [
  "20261019183000_marriage_counselor_consent_foundation",
  "20261019200000_marriage_counselor_disclosure_separation",
];

const MOD = "mod-02-family-background";
const Q = "fb-sensitive";

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
      /* ignore non-itest .env.local */
    }
  }
}

async function assertSchemaReady(prisma: Awaited<ReturnType<typeof assertLiveLocalPostgresTarget>>) {
  const migrations = await prisma.$queryRaw<
    Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>
  >`SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"`;

  const missing: string[] = [];
  for (const name of PENDING_MIGRATIONS) {
    const row = migrations.find((m) => m.migration_name === name);
    if (!row?.finished_at || row.rolled_back_at) missing.push(name);
  }

  const cols = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'MarriageSharingConsent'`;
  const colSet = new Set(cols.map((c) => c.column_name));
  const requiredCols = [
    "consentedCounselorUserId",
    "generationAtGrant",
    "answerFingerprint",
    "grantedAt",
    "counselorDisclosureGranted",
  ];
  const missingCols = requiredCols.filter((c) => !colSet.has(c));

  const genTable = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'MarriageAnswerChangeGeneration'
    ) AS exists`;

  return {
    ready: missing.length === 0 && missingCols.length === 0 && genTable[0]?.exists === true,
    missingMigrations: missing,
    missingCols,
    genTable: Boolean(genTable[0]?.exists),
  };
}

async function assertLiveLocalPostgresTarget() {
  const { prisma } = await import("../src/lib/db");
  const dbRows = await prisma.$queryRaw<Array<{ name: string | null }>>`
    SELECT current_database()::text AS name`;
  const liveName = dbRows[0]?.name?.trim();
  if (liveName !== ITEST_REQUIRED.REQUIRED_DATABASE) {
    fail(`current_database() is "${liveName}", expected "${ITEST_REQUIRED.REQUIRED_DATABASE}"`);
  }
  const addrRows = await prisma.$queryRaw<Array<{ server_host: string | null }>>`
    SELECT host(inet_server_addr()) AS server_host`;
  const serverHost = addrRows[0]?.server_host?.trim();
  if (serverHost && serverHost !== ITEST_REQUIRED.REQUIRED_HOST) {
    fail(`host(inet_server_addr()) is "${serverHost}", expected ${ITEST_REQUIRED.REQUIRED_HOST}`);
  }
  return prisma;
}

async function cleanupJourney(prisma: Awaited<ReturnType<typeof assertLiveLocalPostgresTarget>>, journeyId: string) {
  await prisma.marriageAnswerChangeGeneration.deleteMany({ where: { journeyId } });
  await prisma.marriageSharingConsent.deleteMany({ where: { journeyId } });
  await prisma.marriageAuditLog.deleteMany({ where: { journeyId } });
  await prisma.marriageDiscussionMark.deleteMany({ where: { journeyId } });
  await prisma.marriageCounselorNote.deleteMany({ where: { journeyId } });
  await prisma.marriageCounselingSession.deleteMany({ where: { journeyId } });
  await prisma.marriageJournalEntry.deleteMany({ where: { journeyId } });
  await prisma.marriageComparisonUnlock.deleteMany({ where: { journeyId } });
  await prisma.marriageAssessmentResponse.deleteMany({ where: { journeyId } });
  await prisma.marriageJourneyConsent.deleteMany({ where: { journeyId } });
  await prisma.marriageCounselingJourney.deleteMany({ where: { id: journeyId } });
}

async function setupJourney(runTag: string) {
  const { marriageStore } = await import("../src/lib/stores/marriage-counseling-store");
  const store = marriageStore();
  const journeyId = `p3e-itest-${runTag}`;
  const uA = `p3e-u-a-${runTag}`;
  const uB = `p3e-u-b-${runTag}`;
  const cA = "p3e-c-a";
  const cB = "p3e-c-b";
  const now = new Date().toISOString();

  await store.createJourney({
    id: journeyId,
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: MOD,
    counselorUserId: cA,
    createdBy: uA,
    participantAId: uA,
    participantBId: uB,
    guidedModuleIds: [MOD],
    curriculumVersion: "v1",
  });

  await store.saveResponse({
    id: `p3e-resp-a-${runTag}`,
    journeyId,
    moduleId: MOD,
    contentVersion: "v1",
    userId: uA,
    status: "submitted",
    answers: { [Q]: `p3e-private-${runTag}` },
    lastSavedAt: now,
    submittedAt: now,
  });

  await store.saveResponse({
    id: `p3e-resp-b-${runTag}`,
    journeyId,
    moduleId: MOD,
    contentVersion: "v1",
    userId: uB,
    status: "submitted",
    answers: { [Q]: `p3e-private-b-${runTag}` },
    lastSavedAt: now,
    submittedAt: now,
  });

  const journey = await store.getJourneyById(journeyId);
  assert.ok(journey);
  return { store, journeyId, journey, uA, uB, cA, cB, now };
}

async function main() {
  if (!process.env.MARRIAGE_PRISMA_ITEST?.trim()) {
    process.env.MARRIAGE_PRISMA_ITEST = "1";
  }
  loadDatabaseUrlFromEnvLocalIfUnset();
  validateConfiguredDatabaseUrls();
  prepareProcessForPrismaIntegration();
  process.env.MARRIAGE_COUNSELOR_USER_IDS =
    process.env.MARRIAGE_COUNSELOR_USER_IDS?.trim() || "p3e-c-a,p3e-c-b,p3e-pastor";

  const prisma = await assertLiveLocalPostgresTarget();
  const schema = await assertSchemaReady(prisma);
  if (!schema.ready) {
    console.log(
      JSON.stringify(
        {
          verdict: "BLOCKED",
          reason: "local itest schema not ready",
          missingMigrations: schema.missingMigrations,
          missingCols: schema.missingCols,
          genTable: schema.genTable,
          hint: "Run scripts/run-local-marriage-itest-migrations.ps1 on 127.0.0.1/shanah_marriage_itest only",
        },
        null,
        2,
      ),
    );
    process.exit(2);
  }

  const results: TestResult[] = [];
  const runTag = String(Date.now());
  const journeyIdsToCleanup: string[] = [];
  let journeyId = "";

  try {
    const { buildCounselorAuthorizedAnswerViews } = await import(
      "../src/lib/marriage-counselor-clinical-detail"
    );
    const {
      counselorConsentGrantVersionFromModuleStatus,
      grantCounselorAnswerConsent,
      listCounselorConsentStatusForModule,
      revokeCounselorAnswerConsent,
    } = await import("../src/lib/marriage-counselor-consent-participant");

    async function grantCounselorAtListedVersion(
      participantId: string,
      targetJourneyId: string = journeyId,
    ) {
      const status = await listCounselorConsentStatusForModule(
        member(participantId),
        targetJourneyId,
        MOD,
      );
      const version = counselorConsentGrantVersionFromModuleStatus(status, Q);
      await grantCounselorAnswerConsent(
        member(participantId),
        targetJourneyId,
        MOD,
        Q,
        version,
      );
    }

    async function commitSubmittedAnswerVersion(
      targetJourneyId: string,
      userId: string,
      nextAnswer: string,
    ) {
      const { getChangedCounselorConsentQuestionIds } = await import(
        "../src/lib/marriage-assessment-answer-changes"
      );
      const { getModuleDefinition } = await import("../src/lib/marriage-curriculum-service");
      const mod = await getModuleDefinition(MOD);
      assert.ok(mod);
      const resp = await ctx.store.getResponse(targetJourneyId, MOD, userId);
      assert.ok(resp?.status === "submitted");
      const changed = getChangedCounselorConsentQuestionIds(mod.questions, resp.answers, {
        ...resp.answers,
        [Q]: nextAnswer,
      });
      await db.saveAssessmentResponseWithCounselorConsentInvalidation(
        {
          ...resp,
          answers: { ...resp.answers, [Q]: nextAnswer },
          lastSavedAt: new Date().toISOString(),
        },
        changed,
      );
    }

    function counselorRowForParticipant(
      views: Awaited<ReturnType<typeof buildCounselorAuthorizedAnswerViews>>,
      userId: string,
    ) {
      return views.find((v) => v.userId === userId && v.questionId === Q);
    }
    const { getCounselorJourneyDetail } = await import("../src/lib/marriage-counseling-counselor-server");
    const { exportJourneyData } = await import("../src/lib/marriage-counseling-privacy-server");
    const db = await import("../src/lib/stores/marriage-counseling-db");

    const ctx = await setupJourney(runTag);
    journeyId = ctx.journeyId;
    journeyIdsToCleanup.push(journeyId);

    // A — denied by default
    {
      const views = await buildCounselorAuthorizedAnswerViews(member(ctx.cA), ctx.journey);
      const row = views.find((v) => v.questionId === Q && v.userId === ctx.uA);
      results.push({
        id: "A",
        pass: Boolean(row?.withheld),
        detail: row?.withheld ? "withheld before consent" : "unexpected disclosure",
      });
    }

    // B — submission alone
    {
      const consentCount = await prisma.marriageSharingConsent.count({ where: { journeyId } });
      const views = await buildCounselorAuthorizedAnswerViews(member(ctx.cA), ctx.journey);
      const row = views.find((v) => v.questionId === Q);
      results.push({
        id: "B",
        pass: consentCount === 0 && Boolean(row?.withheld),
        detail: `consents=${consentCount} withheld=${row?.withheld}`,
      });
    }

    // C — spouse isolation (consent is per-participant; uB grant does not disclose uA's answer)
    {
      await grantCounselorAtListedVersion(ctx.uA);
      const consents = await prisma.marriageSharingConsent.findMany({ where: { journeyId, questionId: Q } });
      const uAConsent = consents.find((c) => c.userId === ctx.uA);
      const uBConsent = consents.find((c) => c.userId === ctx.uB);
      const views = await buildCounselorAuthorizedAnswerViews(member(ctx.cA), ctx.journey);
      const rowA = views.find((v) => v.userId === ctx.uA && v.questionId === Q);
      const rowB = views.find((v) => v.userId === ctx.uB && v.questionId === Q);
      results.push({
        id: "C",
        pass:
          Boolean(uAConsent?.counselorDisclosureGranted) &&
          !uBConsent?.counselorDisclosureGranted &&
          Boolean(rowA && !rowA.withheld) &&
          Boolean(rowB?.withheld),
        detail: `u-a consent=${Boolean(uAConsent?.counselorDisclosureGranted)} u-b consent=${Boolean(uBConsent?.counselorDisclosureGranted)}`,
      });
    }

    // D — assigned counselor authorized view
    {
      const views = await buildCounselorAuthorizedAnswerViews(member(ctx.cA), ctx.journey);
      const row = views.find((v) => v.userId === ctx.uA && v.questionId === Q);
      results.push({
        id: "D",
        pass: Boolean(row && !row.withheld && "answer" in row),
        detail: row && !row.withheld ? "authorized answer visible to assigned counselor" : "denied",
      });
    }

    // E — unassigned counselor cannot open unrelated journey detail
    {
      const viewsB = await buildCounselorAuthorizedAnswerViews(member(ctx.cB), ctx.journey);
      const rowB = viewsB.find((v) => v.questionId === Q && v.userId === ctx.uA);
      let pastorDenied = false;
      try {
        await getCounselorJourneyDetail(member("p3e-pastor"), journeyId);
      } catch {
        pastorDenied = true;
      }
      results.push({
        id: "E",
        pass: Boolean(rowB?.withheld) && pastorDenied,
        detail: `c-b withheld=${rowB?.withheld} unassigned pastor denied=${pastorDenied}`,
      });
    }

    // F — revoke
    {
      await revokeCounselorAnswerConsent(member(ctx.uA), journeyId, MOD, Q);
      const views = await buildCounselorAuthorizedAnswerViews(member(ctx.cA), ctx.journey);
      const row = views.find((v) => v.userId === ctx.uA && v.questionId === Q);
      results.push({
        id: "F",
        pass: Boolean(row?.withheld),
        detail: `after revoke withheld=${row?.withheld}`,
      });
    }

    // G — answer edit invalidates consent (including revert to original text)
    {
      const { getChangedCounselorConsentQuestionIds } = await import(
        "../src/lib/marriage-assessment-answer-changes"
      );
      const { getModuleDefinition } = await import("../src/lib/marriage-curriculum-service");
      const mod = await getModuleDefinition(MOD);
      assert.ok(mod);
      const original = `p3e-private-${runTag}`;
      const edited = `${original}-edited-once`;
      await grantCounselorAtListedVersion(ctx.uA);
      let resp = await ctx.store.getResponse(journeyId, MOD, ctx.uA);
      assert.ok(resp?.status === "submitted");
      const editAt = new Date().toISOString();
      let changed = getChangedCounselorConsentQuestionIds(mod.questions, resp.answers, {
        ...resp.answers,
        [Q]: edited,
      });
      await db.saveAssessmentResponseWithCounselorConsentInvalidation(
        { ...resp, answers: { ...resp.answers, [Q]: edited }, lastSavedAt: editAt },
        changed,
      );
      let j = await ctx.store.getJourneyById(journeyId);
      assert.ok(j);
      let views = await buildCounselorAuthorizedAnswerViews(member(ctx.cA), j);
      let row = views.find((v) => v.userId === ctx.uA && v.questionId === Q);
      if (!row?.withheld) {
        results.push({ id: "G", pass: false, detail: "withheld after first edit" });
      } else {
        resp = await ctx.store.getResponse(journeyId, MOD, ctx.uA);
        assert.ok(resp);
        changed = getChangedCounselorConsentQuestionIds(mod.questions, resp.answers, {
          ...resp.answers,
          [Q]: original,
        });
        const revertAt = new Date().toISOString();
        await db.saveAssessmentResponseWithCounselorConsentInvalidation(
          { ...resp, answers: { ...resp.answers, [Q]: original }, lastSavedAt: revertAt },
          changed,
        );
        j = await ctx.store.getJourneyById(journeyId);
        assert.ok(j);
        views = await buildCounselorAuthorizedAnswerViews(member(ctx.cA), j);
        row = views.find((v) => v.userId === ctx.uA && v.questionId === Q);
        results.push({
          id: "G",
          pass: Boolean(row?.withheld),
          detail: "revert to original text still withheld (generation/fingerprint)",
        });
      }
    }

    // H — reassignment A→B→A
    {
      await grantCounselorAtListedVersion(ctx.uA);
      await db.applyCounselorJourneyAccessChange(journeyId, { counselorUserId: ctx.cB });
      let j = await ctx.store.getJourneyById(journeyId);
      assert.ok(j);
      let views = await buildCounselorAuthorizedAnswerViews(member(ctx.cB), j);
      assert.equal(views.find((v) => v.questionId === Q)?.withheld, true);
      await db.applyCounselorJourneyAccessChange(journeyId, { counselorUserId: ctx.cA });
      j = await ctx.store.getJourneyById(journeyId);
      assert.ok(j);
      views = await buildCounselorAuthorizedAnswerViews(member(ctx.cA), j);
      const row = views.find((v) => v.questionId === Q && v.userId === ctx.uA);
      results.push({
        id: "H",
        pass: Boolean(row?.withheld),
        detail: "A→B→A does not restore consent",
      });
    }

    // I — concurrent consent grant + answer edit
    {
      await db.applyCounselorJourneyAccessChange(journeyId, { counselorUserId: ctx.cA });
      const { getChangedCounselorConsentQuestionIds } = await import(
        "../src/lib/marriage-assessment-answer-changes"
      );
      const { getModuleDefinition } = await import("../src/lib/marriage-curriculum-service");
      const mod = await getModuleDefinition(MOD);
      assert.ok(mod);
      const respBefore = await ctx.store.getResponse(journeyId, MOD, ctx.uA);
      assert.ok(respBefore);
      const originalAnswer = respBefore.answers[Q];
      const { computeAnswerFingerprint } = await import("../src/lib/marriage-counselor-consent");
      const originalFingerprint = computeAnswerFingerprint(originalAnswer);
      const concurrentEdit = `${originalAnswer}-race-edit`;
      const listedVersionI = counselorConsentGrantVersionFromModuleStatus(
        await listCounselorConsentStatusForModule(member(ctx.uA), journeyId, MOD),
        Q,
      );
      const raceI = await Promise.allSettled([
        grantCounselorAnswerConsent(member(ctx.uA), journeyId, MOD, Q, listedVersionI),
        (async () => {
          const changed = getChangedCounselorConsentQuestionIds(mod.questions, respBefore.answers, {
            ...respBefore.answers,
            [Q]: concurrentEdit,
          });
          await db.saveAssessmentResponseWithCounselorConsentInvalidation(
            {
              ...respBefore,
              answers: { ...respBefore.answers, [Q]: concurrentEdit },
              lastSavedAt: new Date().toISOString(),
            },
            changed,
          );
        })(),
      ]);
      const j = await ctx.store.getJourneyById(journeyId);
      assert.ok(j);
      const respAfter = await ctx.store.getResponse(journeyId, MOD, ctx.uA);
      assert.ok(respAfter);
      const editApplied = respAfter.answers[Q] === concurrentEdit;
      const grantOk = raceI[0].status === "fulfilled";
      const editOk = raceI[1].status === "fulfilled";
      const grantRejected =
        raceI[0].status === "rejected" &&
        raceI[0].reason instanceof Error &&
        /Your answer has changed|Counselor assignment does not match/i.test(raceI[0].reason.message);

      const views = await buildCounselorAuthorizedAnswerViews(member(ctx.cA), j);
      const row = views.find((v) => v.userId === ctx.uA && v.questionId === Q);
      const disclosed = Boolean(row && !row.withheld && "answer" in row);

      const { verifyCounselorAnswerDisclosure } = await import("../src/lib/marriage-counselor-consent");
      const consents = await ctx.store.listSharingConsents(journeyId, MOD);
      const consent =
        consents.find((c) => c.questionId === Q && c.userId === ctx.uA) ?? null;
      const generation =
        (await ctx.store.getAnswerChangeGeneration(journeyId, MOD, Q, ctx.uA)) ?? 0;
      const currentAnswer = respAfter.answers[Q];
      const currentFingerprint = computeAnswerFingerprint(currentAnswer);
      const verify =
        consent && disclosed
          ? verifyCounselorAnswerDisclosure({
              consent,
              currentGeneration: generation,
              assignedCounselorUserId: j.counselorUserId,
              viewerCounselorUserId: ctx.cA,
              currentAnswer,
            })
          : { allowed: false as const };

      // True stale leak: consent still bound to pre-race fingerprint while DB answer changed.
      const staleConsentDisclosure =
        disclosed &&
        consent?.counselorDisclosureGranted === true &&
        consent.answerFingerprint?.trim() === originalFingerprint &&
        currentFingerprint !== originalFingerprint;

      const consentMatchesCurrentAnswer =
        consent?.counselorDisclosureGranted === true &&
        consent.answerFingerprint?.trim() === currentFingerprint &&
        consent.generationAtGrant === generation &&
        consent.consentedCounselorUserId === j.counselorUserId;

      const pass =
        !staleConsentDisclosure &&
        (!disclosed || (verify.allowed && consentMatchesCurrentAnswer));

      results.push({
        id: "I",
        pass,
        detail: `editApplied=${editApplied} grantOk=${grantOk} disclosed=${disclosed} staleConsent=${staleConsentDisclosure} consentMatchesCurrent=${consentMatchesCurrentAnswer} fpOriginal=${consent?.answerFingerprint === originalFingerprint} fpCurrent=${consent?.answerFingerprint?.trim() === currentFingerprint}`,
        concurrent: true,
      });
    }

    // J — concurrent consent grant + counselor reassignment (prior counselor must not retain access)
    {
      await db.applyCounselorJourneyAccessChange(journeyId, { counselorUserId: ctx.cA });
      const listedVersionJ = counselorConsentGrantVersionFromModuleStatus(
        await listCounselorConsentStatusForModule(member(ctx.uA), journeyId, MOD),
        Q,
      );
      const raceJ = await Promise.allSettled([
        grantCounselorAnswerConsent(member(ctx.uA), journeyId, MOD, Q, listedVersionJ),
        db.applyCounselorJourneyAccessChange(journeyId, { counselorUserId: ctx.cB }),
      ]);
      const grantRejected =
        raceJ[0].status === "rejected" &&
        raceJ[0].reason instanceof Error &&
        raceJ[0].reason.message === "Counselor assignment does not match.";
      const j = await ctx.store.getJourneyById(journeyId);
      assert.ok(j);
      assert.equal(j.counselorUserId, ctx.cB, "reassignment must win for test J");
      const viewsPrior = await buildCounselorAuthorizedAnswerViews(member(ctx.cA), j);
      const rowPrior = viewsPrior.find((v) => v.userId === ctx.uA && v.questionId === Q);
      results.push({
        id: "J",
        pass: j.counselorUserId === ctx.cB && Boolean(rowPrior?.withheld),
        detail: `assigned=${j.counselorUserId} prior-counselor withheld=${rowPrior?.withheld} grantRejected=${grantRejected}`,
        concurrent: true,
      });
    }

    // K — privacy surfaces (journal / session export; unassigned counselor denied)
    {
      await db.addJournalEntry({
        id: `p3e-j-${runTag}`,
        journeyId,
        authorId: ctx.uA,
        authorName: ctx.uA,
        visibility: "private",
        kind: "reflection",
        body: `secret-journal-${runTag}`,
        moduleId: MOD,
        createdAt: ctx.now,
        updatedAt: ctx.now,
      });
      await ctx.store.saveSession({
        id: `p3e-s-${runTag}`,
        journeyId,
        scheduledAt: ctx.now,
        topic: "p3e topic",
        notes: `secret-notes-${runTag}`,
        status: "scheduled",
        createdBy: ctx.cA,
        createdAt: ctx.now,
      });
      const exportA = await exportJourneyData(member(ctx.uA), journeyId);
      const hasOwnJournal = exportA.journal.some((e) => e.id === `p3e-j-${runTag}`);
      let unassignedCounselorDenied = false;
      try {
        await exportJourneyData(member(ctx.cB), journeyId);
      } catch {
        unassignedCounselorDenied = true;
      }
      let comparisonDenied = false;
      try {
        const { getComparisonForViewer } = await import("../src/lib/marriage-counseling-server");
        await getComparisonForViewer(member(ctx.cB), MOD);
      } catch {
        comparisonDenied = true;
      }
      results.push({
        id: "K",
        pass: hasOwnJournal && unassignedCounselorDenied && comparisonDenied,
        detail: `journal export participant=${hasOwnJournal} c-b export denied=${unassignedCounselorDenied} c-b compare denied=${comparisonDenied}`,
      });
    }

    const { COUNSELOR_CONSENT_ANSWER_CHANGED_MESSAGE } = await import(
      "../src/lib/marriage-counselor-consent"
    );

    // L — stale V1 grant rejected; explicit V2 grant + revoke (edit before consent)
    {
      const tagL = `${runTag}-3fL`;
      const ctxL = await setupJourney(tagL);
      journeyIdsToCleanup.push(ctxL.journeyId);
      const v1 = `p3e-private-${tagL}`;
      const v2 = `${v1}-v2`;

      const statusV1 = await listCounselorConsentStatusForModule(member(ctxL.uA), ctxL.journeyId, MOD);
      const versionV1 = counselorConsentGrantVersionFromModuleStatus(statusV1, Q);
      const itemV1 = statusV1.items.find((i) => i.questionId === Q);
      const reviewedV1 =
        Boolean(itemV1?.savedAnswerDisplay?.includes(v1)) &&
        itemV1?.answerFingerprint === versionV1.answerFingerprint;

      await commitSubmittedAnswerVersion(ctxL.journeyId, ctxL.uA, v2);

      let staleGrantRejected = false;
      try {
        await grantCounselorAnswerConsent(member(ctxL.uA), ctxL.journeyId, MOD, Q, versionV1);
      } catch (e) {
        staleGrantRejected =
          e instanceof Error && e.message === COUNSELOR_CONSENT_ANSWER_CHANGED_MESSAGE;
      }

      let jL = await ctx.store.getJourneyById(ctxL.journeyId);
      assert.ok(jL);
      let viewsL = await buildCounselorAuthorizedAnswerViews(member(ctxL.cA), jL);
      const rowAfterStale = counselorRowForParticipant(viewsL, ctxL.uA);
      const v2WithheldAfterStale = Boolean(rowAfterStale?.withheld);

      const statusV2 = await listCounselorConsentStatusForModule(member(ctxL.uA), ctxL.journeyId, MOD);
      const versionV2 = counselorConsentGrantVersionFromModuleStatus(statusV2, Q);
      const reviewedV2 = statusV2.items
        .find((i) => i.questionId === Q)
        ?.savedAnswerDisplay?.includes(v2);

      await grantCounselorAnswerConsent(member(ctxL.uA), ctxL.journeyId, MOD, Q, versionV2);

      jL = await ctx.store.getJourneyById(ctxL.journeyId);
      assert.ok(jL);
      viewsL = await buildCounselorAuthorizedAnswerViews(member(ctxL.cA), jL);
      const rowGrantedV2 = counselorRowForParticipant(viewsL, ctxL.uA);
      const counselorSeesV2 = Boolean(
        rowGrantedV2 &&
          !rowGrantedV2.withheld &&
          "answer" in rowGrantedV2 &&
          rowGrantedV2.answer === v2,
      );

      await revokeCounselorAnswerConsent(member(ctxL.uA), ctxL.journeyId, MOD, Q);
      jL = await ctx.store.getJourneyById(ctxL.journeyId);
      assert.ok(jL);
      viewsL = await buildCounselorAuthorizedAnswerViews(member(ctxL.cA), jL);
      const rowRevoked = counselorRowForParticipant(viewsL, ctxL.uA);

      results.push({
        id: "L",
        pass:
          reviewedV1 &&
          staleGrantRejected &&
          v2WithheldAfterStale &&
          Boolean(reviewedV2) &&
          counselorSeesV2 &&
          Boolean(rowRevoked?.withheld),
        detail: `reviewV1=${reviewedV1} staleRejected=${staleGrantRejected} v2Withheld=${v2WithheldAfterStale} reviewV2=${Boolean(reviewedV2)} counselorV2=${counselorSeesV2} revoked=${Boolean(rowRevoked?.withheld)}`,
      });
    }

    // M — consent for V1 commits; answer edit to V2 invalidates; V2 withheld
    {
      const tagM = `${runTag}-3fM`;
      const ctxM = await setupJourney(tagM);
      journeyIdsToCleanup.push(ctxM.journeyId);
      const v1 = `p3e-private-${tagM}`;
      const v2 = `${v1}-v2`;

      await grantCounselorAtListedVersion(ctxM.uA, ctxM.journeyId);

      let jM = await ctx.store.getJourneyById(ctxM.journeyId);
      assert.ok(jM);
      let viewsM = await buildCounselorAuthorizedAnswerViews(member(ctxM.cA), jM);
      const rowV1 = counselorRowForParticipant(viewsM, ctxM.uA);
      const counselorSawV1 =
        rowV1 !== undefined &&
        !rowV1.withheld &&
        "answer" in rowV1 &&
        rowV1.answer === v1;

      await commitSubmittedAnswerVersion(ctxM.journeyId, ctxM.uA, v2);

      const consentRow = await prisma.marriageSharingConsent.findFirst({
        where: { journeyId: ctxM.journeyId, questionId: Q, userId: ctxM.uA },
      });
      jM = await ctx.store.getJourneyById(ctxM.journeyId);
      assert.ok(jM);
      viewsM = await buildCounselorAuthorizedAnswerViews(member(ctxM.cA), jM);
      const rowAfterEdit = counselorRowForParticipant(viewsM, ctxM.uA);

      const { verifyCounselorAnswerDisclosure } = await import("../src/lib/marriage-counselor-consent");
      const storeConsent = (await ctx.store.listSharingConsents(ctxM.journeyId, MOD)).find(
        (c) => c.questionId === Q && c.userId === ctxM.uA,
      );
      const generation =
        (await ctx.store.getAnswerChangeGeneration(ctxM.journeyId, MOD, Q, ctxM.uA)) ?? 0;
      const respAfter = await ctx.store.getResponse(ctxM.journeyId, MOD, ctxM.uA);
      assert.ok(respAfter);
      const verifyAfterEdit = storeConsent
        ? verifyCounselorAnswerDisclosure({
            consent: storeConsent,
            currentGeneration: generation,
            assignedCounselorUserId: jM.counselorUserId,
            viewerCounselorUserId: ctxM.cA,
            currentAnswer: respAfter.answers[Q],
          })
        : { allowed: false as const };
      const verifyDenied = verifyAfterEdit.allowed === false;

      results.push({
        id: "M",
        pass:
          counselorSawV1 &&
          consentRow?.counselorDisclosureGranted === false &&
          Boolean(rowAfterEdit?.withheld) &&
          verifyDenied,
        detail: `counselorV1=${counselorSawV1} consentInvalidated=${consentRow?.counselorDisclosureGranted === false} withheldV2=${Boolean(rowAfterEdit?.withheld)} verifyDenied=${verifyDenied}`,
      });
    }
  } finally {
    for (const id of [...new Set(journeyIdsToCleanup)]) {
      await cleanupJourney(prisma, id);
    }
  }

  const remaining = await prisma.marriageCounselingJourney.count({
    where: { id: { in: [...new Set(journeyIdsToCleanup)] } },
  });

  const allPass = results.every((r) => r.pass);
  const concurrentRan = results.some((r) => r.concurrent);

  console.log(
    JSON.stringify(
      {
        verdict: allPass ? "PASS" : "PARTIAL",
        database: ITEST_REQUIRED.REQUIRED_DATABASE,
        host: ITEST_REQUIRED.REQUIRED_HOST,
        schemaReady: true,
        tests: results,
        realConcurrentTransactions: concurrentRan,
        cleanupJourneyRowsRemaining: remaining,
        cleanupOk: remaining === 0,
      },
      null,
      2,
    ),
  );

  if (!allPass) process.exit(1);
}

main().catch((err) => {
  console.log(
    JSON.stringify({
      verdict: "BLOCKED",
      error: err instanceof Error ? err.message : String(err),
    }),
  );
  process.exit(1);
});
