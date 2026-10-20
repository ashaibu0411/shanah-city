/**
 * Phase 3E — read-only local itest PostgreSQL identity check (SELECT only).
 *
 * Uses src/lib/db.ts (PrismaPg + pg Pool + DATABASE_URL). Do not pass datasources to PrismaClient.
 *
 * Prerequisites: MARRIAGE_PRISMA_ITEST=1, DATABASE_URL and DIRECT_URL → 127.0.0.1:5432/shanah_marriage_itest
 */
import {
  fail,
  validateConfiguredDatabaseUrls,
  describeSafeConnectionTarget,
  ITEST_REQUIRED,
} from "./marriage-itest-pg-target";

async function main() {
  const targets = validateConfiguredDatabaseUrls();
  const safeTarget = describeSafeConnectionTarget(
    process.env.DATABASE_URL!.trim(),
    "DATABASE_URL",
  );

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

  await prisma.$disconnect();

  console.log(
    JSON.stringify({
      verdict: "PASS",
      database: ITEST_REQUIRED.REQUIRED_DATABASE,
      host: ITEST_REQUIRED.REQUIRED_HOST,
      port: "5432",
      username: safeTarget.username,
      urlValidation: `DATABASE_URL and ${targets.length > 1 ? "DIRECT_URL" : "configured URLs"} match local itest target`,
      identityCheck: "current_database() confirmed",
    }),
  );
}

function blockedReason(err: unknown): string {
  const text = err instanceof Error ? err.message : String(err);
  if (text.includes("28P01") || /password authentication failed/i.test(text)) {
    return (
      "PostgreSQL password authentication failed for user postgres. " +
      "URL target validation passed; rebuild DATABASE_URL and DIRECT_URL in this shell using " +
      "[Uri]::EscapeDataString on the password (same as scripts/run-local-marriage-itest.ps1), " +
      "or confirm the password with that script's psql preflight. Do not use Neon .env URLs."
    );
  }
  return text.replace(/\s+/g, " ").trim();
}

main().catch((err) => {
  let safeTarget: { host: string; port: string; database: string; username: string } | undefined;
  try {
    const url = process.env.DATABASE_URL?.trim();
    if (url) safeTarget = describeSafeConnectionTarget(url, "DATABASE_URL");
  } catch {
    /* ignore parse errors on failure path */
  }
  console.log(
    JSON.stringify({
      verdict: "BLOCKED",
      error: blockedReason(err),
      ...(safeTarget ? { connectionTarget: safeTarget } : {}),
      hint:
        safeTarget && /28P01|password authentication failed/i.test(String(err))
          ? "Run: powershell -ExecutionPolicy Bypass -File scripts/set-local-marriage-itest-database-url.ps1 -RunVerify"
          : undefined,
    }),
  );
  process.exit(1);
});
