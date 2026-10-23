import { VERIFIED_STAGING_VERCEL_PROJECT_ID } from "@/lib/vercel-staging-project-id";

/** Must match scripts/build-migrate-guard.cjs — staging Neon pair. */
const STAGING_POOLED_HOST =
  "ep-soft-flower-b89de4t0-pooler.c-14.us-east-1.aws.neon.tech";
const STAGING_DIRECT_HOST = "ep-soft-flower-b89de4t0.c-14.us-east-1.aws.neon.tech";

/** Must match scripts/build-migrate-guard.cjs — production Neon pair. */
const PRODUCTION_POOLED_HOST =
  "ep-young-glade-auv3jgsb-pooler.c-10.us-east-1.aws.neon.tech";
const PRODUCTION_DIRECT_HOST = "ep-young-glade-auv3jgsb.c-10.us-east-1.aws.neon.tech";

const EXPECTED_DATABASE_NAME = "neondb";

const LIVE_PRODUCTION_VERCEL_PROJECT_NAME = "shanah-city";

export type Phase3mDatabaseIdentityClassification =
  | "STAGING_DATABASE"
  | "PRODUCTION_DATABASE"
  | "UNKNOWN_DATABASE"
  | "DATABASE_NOT_CONFIGURED";

/** @internal Unit tests only */
let verifiedStagingProjectIdOverrideForTests: string | null = null;

/** @internal */
export function setVerifiedStagingProjectIdForDatabaseIdentityTests(
  projectId: string | null,
): void {
  verifiedStagingProjectIdOverrideForTests = projectId;
}

function resolvedVerifiedStagingVercelProjectId(): string {
  const fromSource =
    verifiedStagingProjectIdOverrideForTests ?? VERIFIED_STAGING_VERCEL_PROJECT_ID;
  return fromSource.trim();
}

function parsePostgresHostname(connectionString: string): string | null {
  const trimmed = connectionString.trim();
  if (!/^postgres(ql)?:\/\//i.test(trimmed)) {
    return null;
  }
  try {
    const parsed = new URL(
      trimmed.replace(/^postgresql:/i, "http:").replace(/^postgres:/i, "http:"),
    );
    return parsed.hostname || null;
  } catch {
    return null;
  }
}

function parsePostgresDatabaseName(connectionString: string): string | null {
  const trimmed = connectionString.trim();
  if (!/^postgres(ql)?:\/\//i.test(trimmed)) {
    return null;
  }
  try {
    const parsed = new URL(
      trimmed.replace(/^postgresql:/i, "http:").replace(/^postgres:/i, "http:"),
    );
    const rawPath = parsed.pathname?.replace(/^\//, "") ?? "";
    const database = rawPath ? decodeURIComponent(rawPath.split("/")[0]) : "";
    return database || null;
  } catch {
    return null;
  }
}

export function classifyDatabaseUrlTarget(
  raw?: string,
): Phase3mDatabaseIdentityClassification {
  const connectionString = raw?.trim() ?? process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    return "DATABASE_NOT_CONFIGURED";
  }

  const hostname = parsePostgresHostname(connectionString);
  const database = parsePostgresDatabaseName(connectionString);
  if (!hostname || !database) {
    return "UNKNOWN_DATABASE";
  }

  if (database !== EXPECTED_DATABASE_NAME) {
    return "UNKNOWN_DATABASE";
  }

  if (hostname === STAGING_POOLED_HOST || hostname === STAGING_DIRECT_HOST) {
    return "STAGING_DATABASE";
  }

  if (hostname === PRODUCTION_POOLED_HOST || hostname === PRODUCTION_DIRECT_HOST) {
    return "PRODUCTION_DATABASE";
  }

  return "UNKNOWN_DATABASE";
}

/** Staging Vercel project only; never live shanah-city production project. */
export function isPhase3mDatabaseIdentityDiagnosticActive(): boolean {
  const verifiedId = resolvedVerifiedStagingVercelProjectId();
  if (!verifiedId) return false;

  const projectName = process.env.VERCEL_PROJECT_NAME?.trim();
  if (projectName === LIVE_PRODUCTION_VERCEL_PROJECT_NAME) {
    return false;
  }

  const projectId = process.env.VERCEL_PROJECT_ID?.trim();
  if (!projectId) return false;

  return projectId === verifiedId;
}

export type Phase3mDatabaseIdentityDiagPayload = {
  tag: "phase3m-database-identity-diag";
  classification: Phase3mDatabaseIdentityClassification;
};

export function buildPhase3mDatabaseIdentityDiagPayload(
  classification: Phase3mDatabaseIdentityClassification,
): Phase3mDatabaseIdentityDiagPayload {
  return {
    tag: "phase3m-database-identity-diag",
    classification,
  };
}

let loggedOnThisInstance = false;

/** Server logs only (Vercel function logs). At most once per serverless instance. */
export function logPhase3mDatabaseIdentityDiagnosticOnce(): void {
  if (loggedOnThisInstance) return;
  if (!isPhase3mDatabaseIdentityDiagnosticActive()) return;

  loggedOnThisInstance = true;
  const classification = classifyDatabaseUrlTarget();
  console.info(JSON.stringify(buildPhase3mDatabaseIdentityDiagPayload(classification)));
}

/** @internal Resets once-per-instance guard for unit tests. */
export function resetPhase3mDatabaseIdentityDiagnosticLogForTests(): void {
  loggedOnThisInstance = false;
}
