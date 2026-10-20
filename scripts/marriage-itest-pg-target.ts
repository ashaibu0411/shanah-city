/**
 * Shared fail-closed local itest PostgreSQL target validation (127.0.0.1 / shanah_marriage_itest only).
 */
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
  "ep-soft-flower",
  "ep-young-glade",
];

export type ParsedPgTarget = {
  host: string;
  database: string;
  port: string;
  label: string;
  username: string;
};

export function fail(message: string): never {
  throw new Error(`marriage-itest-pg: ${message}`);
}

export function parsePostgresTarget(raw: string, label: string): ParsedPgTarget {
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
      fail(`${label} remote/cloud host rejected (${fragment})`);
    }
  }
  const pathSegments = url.pathname.split("/").filter((segment) => segment.length > 0);
  if (pathSegments.length !== 1) {
    fail(`${label} pathname must be exactly /${REQUIRED_DATABASE}`);
  }
  const database = decodeURIComponent(pathSegments[0]!);
  if (database !== REQUIRED_DATABASE) {
    fail(`${label} database must be exactly "${REQUIRED_DATABASE}" (got "${database || "(empty)"}")`);
  }
  const port = url.port || REQUIRED_PORT;
  if (port !== REQUIRED_PORT) {
    fail(`${label} port must be exactly ${REQUIRED_PORT} (got ${port})`);
  }
  const username = decodeURIComponent(url.username || "postgres");
  return { host, database, port, label, username };
}

export function describeSafeConnectionTarget(raw: string, label: string) {
  const p = parsePostgresTarget(raw, label);
  return { host: p.host, port: p.port, database: p.database, username: p.username };
}

export function validateConfiguredDatabaseUrls(): ParsedPgTarget[] {
  if (process.env[REQUIRED_OPT_IN]?.trim() !== "1") {
    fail(`Set ${REQUIRED_OPT_IN}=1 to opt in to local Prisma integration writes`);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    fail("DATABASE_URL is required (explicit shell only; never .env.staging.local)");
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
      fail(`${p.label} target must match DATABASE_URL`);
    }
  }
  return parsed;
}

export function prepareProcessForPrismaIntegration() {
  delete process.env.MARRIAGE_E2E_ISOLATED;
  delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
  delete process.env.MARRIAGE_CURRICULUM_DATA_FILE;
  delete process.env.AUTH_DATA_DIR;
  process.env.MARRIAGE_HUB_STAGE2_ENABLED = "1";
}

export const ITEST_REQUIRED = {
  REQUIRED_OPT_IN,
  REQUIRED_HOST,
  REQUIRED_DATABASE,
};
