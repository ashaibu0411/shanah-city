/**
 * Read-only staging DB audit via Vercel-injected env (no credentials printed).
 * Requires: vercel CLI auth + access to shanah-city-staging production env.
 */
import { execSync } from "node:child_process";
import { existsSync, renameSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const log = join(root, ".tmp-staging-readonly-audit.txt");
const STAGING_PROJECT = "shanah-city-staging";
const STAGING_PREFIX = "ep-soft-flower-b89de4t0";
const PROD_PREFIX = "ep-young-glade-auv3jgsb";

const BRANCH_MIGRATIONS = [
  "20261017210000_marriage_discussion_reopen",
  "20261019183000_marriage_counselor_consent_foundation",
  "20261019200000_marriage_counselor_disclosure_separation",
  "20261020120000_marriage_counselor_assignment_approval",
  "20261020130000_marriage_journey_administrative_coordinator",
  "20261024120000_marriage_session_homework",
  "20261024150000_marriage_prep_default_counselor",
  "20261024180000_marriage_premarital_eight_session",
  "20261024200000_marriage_premarital_operations",
  "20261024213000_marriage_certificates_phase5",
  "20261024220000_marriage_supplementary_outcome",
  "20261024230000_marriage_cert_immutable_issue",
  "20261024240000_marriage_prep_notifications",
];

/** Prevent repo .env.local from overriding Vercel-injected staging secrets during CLI audit. */
function withLocalDotenvHidden(fn) {
  const backups = [];
  for (const name of [".env.local", ".env"]) {
    const p = join(root, name);
    const bak = `${p}.__staging_audit_bak`;
    if (existsSync(p)) {
      renameSync(p, bak);
      backups.push([p, bak]);
    }
  }
  try {
    return fn();
  } finally {
    for (const [p, bak] of backups) {
      if (existsSync(bak)) renameSync(bak, p);
    }
  }
}

const lines = [];
lines.push("vercel project inspect:");
lines.push(
  execSync(`npx.cmd vercel project inspect ${STAGING_PROJECT} 2>&1`, {
    cwd: root,
    encoding: "utf8",
  }),
);

lines.push("\nvercel env run (hostname check only, no secrets logged):");
const vercelChildEnv = { ...process.env };
delete vercelChildEnv.DATABASE_URL;
delete vercelChildEnv.DIRECT_URL;
delete vercelChildEnv.DIRECT_DATABASE_URL;
try {
  const hostOut = execSync(
    `npx.cmd vercel env run production --project=${STAGING_PROJECT} -- node scripts/_staging-host-check.mjs 2>&1`,
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      env: vercelChildEnv,
    },
  );
  lines.push(hostOut);
} catch (e) {
  lines.push(String(e.stdout ?? "") + String(e.stderr ?? ""));
}

lines.push("\nmigration audit via vercel env run:");
try {
  const migOut = execSync(
    `npx.cmd vercel env run production --project=${STAGING_PROJECT} -- node scripts/_staging-migrations-query.mjs 2>&1`,
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      env: vercelChildEnv,
    },
  );
  lines.push(migOut);
  try {
    const parsed = JSON.parse(migOut.trim().split("\n").pop());
    const names = new Set(parsed.migrations.map((r) => r.migration_name));
    lines.push("\nBRANCH_MIGRATION_MATRIX:");
    for (const m of BRANCH_MIGRATIONS) {
      const row = parsed.migrations.find((r) => r.migration_name === m);
      lines.push(
        `${m}: ${row ? (row.applied ? "APPLIED" : "FAILED_INCOMPLETE") : "NOT_APPLIED"} rolled_back=${row?.rolled_back_at ?? "n/a"}`,
      );
    }
    lines.push(
      `duplicate_active_cert_journeys_sample: ${JSON.stringify(parsed.duplicateActiveCerts ?? [])}`,
    );
  } catch {
    lines.push("Could not parse migration JSON from env run output.");
  }
} catch (e) {
  lines.push(String(e.stdout ?? "") + String(e.stderr ?? ""));
}

writeFileSync(log, lines.join("\n"));
