/**
 * Pre/post deploy check for GivingStripeMemberSync* audit tables.
 * Prints host/database names only — never connection strings or secrets.
 *
 * Usage:
 *   node scripts/validate-giving-stripe-sync-migration.cjs
 *     → migration file present (offline)
 *   DATABASE_URL=... node scripts/validate-giving-stripe-sync-migration.cjs --check-db
 *     → verifies tables exist on target DB
 */

const fs = require("fs");
const path = require("path");
const {
  parsePostgresConnectionTarget,
  resolvePrismaMigrateDeployPlan,
} = require("./build-migrate-guard.cjs");

const MIGRATION_ID = "20261108200000_giving_stripe_member_sync_audit";
const TABLES = ["GivingStripeMemberSyncRun", "GivingStripeMemberSyncReview"];

function assertMigrationOnDisk() {
  const sqlPath = path.join(
    process.cwd(),
    "prisma",
    "migrations",
    MIGRATION_ID,
    "migration.sql",
  );
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`Missing migration folder prisma/migrations/${MIGRATION_ID}`);
  }
  const sql = fs.readFileSync(sqlPath, "utf8");
  for (const table of TABLES) {
    if (!sql.includes(`"${table}"`)) {
      throw new Error(`Migration SQL does not define ${table}`);
    }
  }
  return { migrationId: MIGRATION_ID, tables: TABLES };
}

async function assertTablesInDatabase(env) {
  const url = env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("--check-db requires DATABASE_URL (values are not logged).");
  }
  const target = parsePostgresConnectionTarget(url);
  if (!target.ok) {
    throw new Error(`DATABASE_URL invalid: ${target.reason}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: url });
  try {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('GivingStripeMemberSyncRun', 'GivingStripeMemberSyncReview')
      ORDER BY table_name
    `);
    const found = rows.map((row) => row.table_name);
    const missing = TABLES.filter((name) => !found.includes(name));
    if (missing.length > 0) {
      throw new Error(
        `Missing tables on ${target.hostname}/${target.database}: ${missing.join(", ")}. Run: npx prisma migrate deploy`,
      );
    }
    return {
      hostname: target.hostname,
      database: target.database,
      tables: found,
    };
  } finally {
    await prisma.$disconnect();
  }
}

function printDeployGuidance(env) {
  const plan = resolvePrismaMigrateDeployPlan(env);
  if (plan.run) {
    console.log(
      `Build migrate plan: prisma migrate deploy during npm run build (${plan.mode} URL).`,
    );
  } else {
    console.log(`Build migrate plan: skipped (${plan.reason}). Run npm run db:deploy before traffic.`);
  }
  console.log(
    `Required migration: ${MIGRATION_ID} must be applied before routes query GivingStripeMemberSync*.`,
  );
}

async function main() {
  const checkDb = process.argv.includes("--check-db");
  const onDisk = assertMigrationOnDisk();
  console.log("giving-stripe-sync-migration: on-disk OK", onDisk);

  printDeployGuidance(process.env);

  if (checkDb) {
    const db = await assertTablesInDatabase(process.env);
    console.log("giving-stripe-sync-migration: database OK", db);
  } else {
    console.log("giving-stripe-sync-migration: offline only (pass --check-db with DATABASE_URL to verify tables).");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
