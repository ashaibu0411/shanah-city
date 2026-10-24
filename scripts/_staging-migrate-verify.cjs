/**
 * Pre/post staging migration verification (read-only). phase argument: pre | post
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const g = require("./build-migrate-guard.cjs");

const PENDING = [
  "20261019183000_marriage_counselor_consent_foundation",
  "20261019200000_marriage_counselor_disclosure_separation",
];

const BASELINE = {
  MarriageCounselingJourney: "2",
  MarriageAssessmentResponse: "3",
  MarriageSharingConsent: "0",
  MarriageJournalEntry: "0",
  MarriageDiscussionMark: "4",
};

function loadStagingLocalEnv() {
  const env = { ...process.env };
  const file = path.join(process.cwd(), ".env.staging.local");
  if (!fs.existsSync(file)) throw new Error("missing .env.staging.local");
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

async function inspect(phase) {
  const env = loadStagingLocalEnv();
  const guard = g.validateManualStagingMigrateDeploy(env);
  const client = new Client({ connectionString: env.DIRECT_URL.trim() });
  await client.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const migrations = (
      await client.query(
        `SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY started_at ASC`,
      )
    ).rows;
    const success = migrations.filter((m) => m.finished_at && !m.rolled_back_at);
    const failed = migrations.filter((m) => !m.finished_at || m.rolled_back_at);
    const latest = [...success].sort(
      (a, b) => new Date(b.finished_at) - new Date(a.finished_at),
    )[0];

    const pending = {};
    for (const name of PENDING) {
      const row = migrations.find((m) => m.migration_name === name);
      pending[name] = Boolean(row?.finished_at && !row?.rolled_back_at);
    }

    const cols = (
      await client.query(
        `SELECT column_name, column_default FROM information_schema.columns
         WHERE table_schema='public' AND table_name='MarriageSharingConsent'`,
      )
    ).rows;
    const colSet = new Set(cols.map((c) => c.column_name));
    const disclosureDefault = cols.find((c) => c.column_name === "counselorDisclosureGranted")
      ?.column_default;

    const genExists = (
      await client.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema='public' AND table_name='MarriageAnswerChangeGeneration'
        ) AS e`,
      )
    ).rows[0]?.e;

    const counts = {};
    for (const table of Object.keys(BASELINE)) {
      const c = await client.query(`SELECT COUNT(*)::bigint AS c FROM "${table}"`);
      counts[table] = String(c.rows[0]?.c ?? "0");
    }

    const counselorDisclosureTrue = colSet.has("counselorDisclosureGranted")
      ? (
          await client.query(
            `SELECT COUNT(*)::bigint AS c FROM "MarriageSharingConsent" WHERE "counselorDisclosureGranted" = true`,
          )
        ).rows[0]?.c
      : null;

    await client.query("ROLLBACK");

    const baselineMatch = Object.keys(BASELINE).every((t) => counts[t] === BASELINE[t]);

    let ok = true;
    const issues = [];
    if (phase === "pre") {
      if (success.length !== 81) {
        ok = false;
        issues.push(`expected 81 applied migrations got ${success.length}`);
      }
      if (failed.length > 0) issues.push("failed migrations present");
      for (const name of PENDING) {
        if (pending[name]) {
          ok = false;
          issues.push(`expected pending ${name}`);
        }
      }
      if (!baselineMatch) {
        ok = false;
        issues.push("baseline counts mismatch");
      }
    } else {
      if (success.length !== 83) {
        ok = false;
        issues.push(`expected 83 applied migrations got ${success.length}`);
      }
      if (failed.length > 0) {
        ok = false;
        issues.push("failed migrations present");
      }
      for (const name of PENDING) {
        if (!pending[name]) {
          ok = false;
          issues.push(`expected applied ${name}`);
        }
      }
      for (const col of [
        "consentedCounselorUserId",
        "generationAtGrant",
        "answerFingerprint",
        "grantedAt",
        "counselorDisclosureGranted",
      ]) {
        if (!colSet.has(col)) {
          ok = false;
          issues.push(`missing column ${col}`);
        }
      }
      if (!genExists) {
        ok = false;
        issues.push("missing MarriageAnswerChangeGeneration");
      }
      if (String(disclosureDefault).includes("false") === false && disclosureDefault !== null) {
        /* allow false default */
      }
      if (counselorDisclosureTrue !== "0" && counselorDisclosureTrue !== 0n) {
        ok = false;
        issues.push(`unexpected counselorDisclosureGranted true count ${counselorDisclosureTrue}`);
      }
      if (!baselineMatch) {
        ok = false;
        issues.push("baseline counts changed after migrate");
      }
    }

    return {
      phase,
      ok,
      issues,
      guard: {
        runtimeHost: guard.runtimeHost,
        migrationHost: guard.migrationHost,
        database: guard.database,
      },
      totalSuccess: success.length,
      latestMigration: latest?.migration_name ?? null,
      pendingApplied: pending,
      schema: {
        consentColumns: [...colSet].sort(),
        counselorDisclosureGrantedDefault: disclosureDefault,
        answerChangeGenTable: Boolean(genExists),
        counselorDisclosureGrantedTrueRows: counselorDisclosureTrue?.toString?.() ?? counselorDisclosureTrue,
      },
      counts,
      baselineMatch,
    };
  } finally {
    await client.end();
  }
}

const phase = process.argv[2] === "post" ? "post" : "pre";
inspect(phase)
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.ok ? 0 : 2);
  })
  .catch((e) => {
    console.log(JSON.stringify({ phase, ok: false, error: e.message }));
    process.exit(1);
  });
