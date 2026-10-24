/**
 * Phase 3C read-only staging inspection (single run). No writes.
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const g = require("./build-migrate-guard.cjs");

const PENDING = [
  "20261019183000_marriage_counselor_consent_foundation",
  "20261019200000_marriage_counselor_disclosure_separation",
];

function loadStagingLocalEnv() {
  const env = { ...process.env };
  const file = path.join(process.cwd(), ".env.staging.local");
  if (!fs.existsSync(file)) {
    throw new Error("missing .env.staging.local");
  }
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

async function q(client, text, params) {
  const res = await client.query(text, params);
  return res.rows;
}

async function main() {
  const env = loadStagingLocalEnv();
  const guard = g.validateManualStagingMigrateDeploy(env);
  const directUrl = env.DIRECT_URL?.trim();
  if (!directUrl) {
    throw new Error("DIRECT_URL missing after guard");
  }

  const client = new Client({ connectionString: directUrl });
  await client.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const dbRow = (await q(client, "SELECT current_database() AS name"))[0];
    let serverAddr = null;
    let serverPort = null;
    try {
      const net = (await q(client, "SELECT inet_server_addr() AS addr, inet_server_port() AS port"))[0];
      serverAddr = net?.addr ?? null;
      serverPort = net?.port ?? null;
    } catch {
      /* Neon may not expose inet_server_addr */
    }

    const migrations = await q(
      client,
      `SELECT migration_name, started_at, finished_at, rolled_back_at, logs
       FROM "_prisma_migrations"
       ORDER BY started_at ASC`,
    );

    const marriageMigrations = migrations.filter((m) =>
      String(m.migration_name).includes("marriage"),
    );

    const failedOrIncomplete = migrations.filter(
      (m) => !m.finished_at || m.rolled_back_at,
    );

    const latestApplied = [...migrations]
      .filter((m) => m.finished_at && !m.rolled_back_at)
      .sort((a, b) => new Date(b.finished_at) - new Date(a.finished_at))[0];

    const pendingStatus = {};
    for (const name of PENDING) {
      const row = migrations.find((m) => m.migration_name === name);
      pendingStatus[name] = row
        ? {
            recorded: true,
            finished: Boolean(row.finished_at && !row.rolled_back_at),
            rolledBack: Boolean(row.rolled_back_at),
          }
        : { recorded: false, finished: false, rolledBack: false };
    }

    const consentCols = await q(
      client,
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'MarriageSharingConsent'
       ORDER BY ordinal_position`,
    );

    const genTable = await q(
      client,
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'MarriageAnswerChangeGeneration'
       ) AS exists`,
    );

    const counts = {};
    for (const table of [
      "MarriageCounselingJourney",
      "MarriageAssessmentResponse",
      "MarriageSharingConsent",
      "MarriageJournalEntry",
      "MarriageDiscussionMark",
    ]) {
      const existsRow = await q(
        client,
        `SELECT EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = $1
         ) AS exists`,
        [table],
      );
      if (!existsRow[0]?.exists) {
        counts[table] = null;
        continue;
      }
      const c = await q(client, `SELECT COUNT(*)::bigint AS c FROM "${table}"`);
      counts[table] = c[0]?.c ?? "0";
    }

    const colNames = new Set(consentCols.map((c) => c.column_name));
    const expectedFoundation = [
      "consentedCounselorUserId",
      "generationAtGrant",
      "answerFingerprint",
      "grantedAt",
    ];
    const schemaFindings = [];
    for (const col of expectedFoundation) {
      if (colNames.has(col)) schemaFindings.push(`column_exists:${col}`);
      else schemaFindings.push(`column_missing:${col}`);
    }
    if (colNames.has("counselorDisclosureGranted")) {
      schemaFindings.push("column_exists:counselorDisclosureGranted");
    } else {
      schemaFindings.push("column_missing:counselorDisclosureGranted");
    }
    if (genTable[0]?.exists) schemaFindings.push("table_exists:MarriageAnswerChangeGeneration");
    else schemaFindings.push("table_missing:MarriageAnswerChangeGeneration");

    const bothPending =
      !pendingStatus[PENDING[0]].finished && !pendingStatus[PENDING[1]].finished;
    const conflict = [];
    if (!pendingStatus[PENDING[0]].finished) {
      for (const col of expectedFoundation) {
        if (colNames.has(col)) conflict.push(`would_conflict_add_column:${col}`);
      }
      if (genTable[0]?.exists) {
        conflict.push("would_conflict_create:MarriageAnswerChangeGeneration");
      }
    }
    if (!pendingStatus[PENDING[1]].finished && colNames.has("counselorDisclosureGranted")) {
      conflict.push("would_conflict_add_column:counselorDisclosureGranted");
    }

    await client.query("ROLLBACK");

    const guardHosts = {
      runtimeHost: guard.runtimeHost,
      migrationHost: guard.migrationHost,
      database: guard.database,
    };

    let verdict = "PASS";
    if (dbRow?.name !== "neondb") verdict = "BLOCKED";
    if (failedOrIncomplete.length > 0) verdict = "NEEDS CORRECTION";
    if (conflict.length > 0 && bothPending) verdict = "NEEDS CORRECTION";

    console.log(
      JSON.stringify(
        {
          verdict,
          guardHosts,
          connectedDatabase: dbRow?.name ?? null,
          serverAddr,
          serverPort,
          totalAppliedMigrations: migrations.filter((m) => m.finished_at && !m.rolled_back_at)
            .length,
          latestAppliedMigration: latestApplied?.migration_name ?? null,
          latestAppliedFinishedAt: latestApplied?.finished_at ?? null,
          failedOrIncomplete: failedOrIncomplete.map((m) => ({
            name: m.migration_name,
            finished_at: m.finished_at,
            rolled_back_at: m.rolled_back_at,
            logsPreview: m.logs ? String(m.logs).slice(0, 200) : null,
          })),
          pendingCounselorMigrations: pendingStatus,
          marriageMigrationCount: marriageMigrations.length,
          schemaFindings,
          migrateSqlConflictsIfRunNow: conflict,
          aggregateCounts: counts,
          safeToAuthorizeGuardedMigrate:
            verdict === "PASS" &&
            bothPending &&
            conflict.length === 0 &&
            failedOrIncomplete.length === 0,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.end();
  }
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
