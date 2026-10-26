/**
 * Read-only production schema audit. Uses DATABASE_URL from env (e.g. .env.production.audit).
 * No writes. Exits non-zero on connection failure.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TABLES = [
  "MarriageCounselorAssignmentRequest",
  "MarriageCounselorAssignmentAcknowledgment",
  "MarriagePrepUserNotification",
  "MarriagePrepDefaultCounselorSetting",
  "MarriagePremaritalProgramSession",
  "MarriagePremaritalSessionClinical",
  "MarriagePremaritalFinalCertificate",
  "MarriageSessionHomework",
  "MarriageCounselingJourney",
];

async function main() {
  const migRows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count FROM "_prisma_migrations"
  `;
  const failed = await prisma.$queryRaw<
    { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }[]
  >`
    SELECT migration_name, finished_at, rolled_back_at
    FROM "_prisma_migrations"
    WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL
    ORDER BY migration_name
  `;

  console.log("migration_count:", String(migRows[0]?.count ?? 0));
  console.log("failed_or_incomplete_migrations:", failed.length);
  for (const row of failed) {
    console.log("  -", row.migration_name, "finished_at=", row.finished_at, "rolled_back_at=", row.rolled_back_at);
  }

  for (const table of TABLES) {
    const exists = await prisma.$queryRaw<{ reg: string | null }[]>`
      SELECT to_regclass(${`public."${table}"`})::text AS reg
    `;
    console.log(`table_${table}:`, exists[0]?.reg ? "present" : "MISSING");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("schema_audit_failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
