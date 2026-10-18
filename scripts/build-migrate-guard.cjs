/**
 * Fail-closed Prisma migrate guard for Vercel project shanah-city-staging only.
 * Hostnames are exact Neon endpoint IDs (not substring prefix checks).
 */
const STAGING_VERCEL_PROJECT = "shanah-city-staging";

/** Staging Neon late-moon-18456188 — pooled runtime endpoint (c-14; pooler hostname pending independent verification). */
const STAGING_POOLED_HOST =
  "ep-soft-flower-b89de4t0-pooler.c-14.us-east-1.aws.neon.tech";

/** Staging Neon — direct (unpooled) migrate endpoint (confirmed). */
const STAGING_DIRECT_HOST = "ep-soft-flower-b89de4t0.c-14.us-east-1.aws.neon.tech";

function getDirectDatabaseUrl(env) {
  if (env.DIRECT_URL?.trim()) {
    return env.DIRECT_URL.trim();
  }
  if (env.DIRECT_DATABASE_URL?.trim()) {
    return env.DIRECT_DATABASE_URL.trim();
  }

  const pooled = env.DATABASE_URL?.trim();
  if (!pooled) {
    return null;
  }
  if (pooled.includes("-pooler.")) {
    return pooled.replace("-pooler.", ".");
  }
  if (pooled.includes("-pooler")) {
    return pooled.replace("-pooler", "");
  }
  return pooled;
}

function parsePostgresHostname(connectionString) {
  if (!connectionString || typeof connectionString !== "string") {
    return { ok: false, reason: "missing connection string" };
  }
  const trimmed = connectionString.trim();
  if (!/^postgres(ql)?:\/\//i.test(trimmed)) {
    return { ok: false, reason: "connection string must use postgres:// or postgresql://" };
  }
  try {
    const parsed = new URL(trimmed.replace(/^postgresql:/i, "http:").replace(/^postgres:/i, "http:"));
    if (!parsed.hostname) {
      return { ok: false, reason: "connection string has no hostname" };
    }
    return { ok: true, hostname: parsed.hostname };
  } catch {
    return { ok: false, reason: "connection string is not a valid URL" };
  }
}

/** Compare pooled vs direct for the two known staging endpoints only. */
function stagingEndpointsAligned(pooledHost, directHost) {
  if (pooledHost === STAGING_POOLED_HOST && directHost === STAGING_DIRECT_HOST) {
    return true;
  }
  const depooled = pooledHost.includes("-pooler.")
    ? pooledHost.replace("-pooler.", ".")
    : pooledHost.includes("-pooler")
      ? pooledHost.replace("-pooler", "")
      : pooledHost;
  return depooled === directHost && directHost === STAGING_DIRECT_HOST;
}

function isStagingVercelBuild(env) {
  if (env.VERCEL !== "1") {
    return false;
  }
  if (env.VERCEL_PROJECT_NAME === STAGING_VERCEL_PROJECT) {
    return true;
  }
  if (env.STAGING_MIGRATE_GUARD === "1") {
    return true;
  }
  return false;
}

/**
 * Validates staging migrate targets. Throws Error with sanitized message (hostnames only).
 * @param {NodeJS.ProcessEnv} env
 */
function validateStagingMigrateGuard(env) {
  if (!isStagingVercelBuild(env)) {
    return { skipped: true };
  }

  if (env.STAGING_MIGRATE_GUARD === "1") {
    const projectName = env.VERCEL_PROJECT_NAME?.trim();
    if (projectName && projectName !== STAGING_VERCEL_PROJECT) {
      throw new Error(
        `Staging migrate guard: STAGING_MIGRATE_GUARD=1 but VERCEL_PROJECT_NAME is "${projectName}", expected "${STAGING_VERCEL_PROJECT}".`,
      );
    }
  }

  const runtimeRaw = env.DATABASE_URL?.trim();
  const migrationRaw = env.DIRECT_URL?.trim();

  if (!runtimeRaw) {
    throw new Error("Staging migrate guard: DATABASE_URL is required for shanah-city-staging builds.");
  }
  if (!migrationRaw) {
    throw new Error(
      "Staging migrate guard: DIRECT_URL must be set explicitly for shanah-city-staging builds.",
    );
  }

  const runtime = parsePostgresHostname(runtimeRaw);
  if (!runtime.ok) {
    throw new Error(`Staging migrate guard: DATABASE_URL invalid (${runtime.reason}).`);
  }

  const migration = parsePostgresHostname(migrationRaw);
  if (!migration.ok) {
    throw new Error(`Staging migrate guard: migration URL invalid (${migration.reason}).`);
  }

  if (runtime.hostname !== STAGING_POOLED_HOST) {
    throw new Error(
      `Staging migrate guard: DATABASE_URL must use staging pooled host ${STAGING_POOLED_HOST} (got ${runtime.hostname}).`,
    );
  }

  if (migration.hostname !== STAGING_DIRECT_HOST) {
    throw new Error(
      `Staging migrate guard: migration URL must use staging direct host ${STAGING_DIRECT_HOST} (got ${migration.hostname}).`,
    );
  }

  if (!stagingEndpointsAligned(runtime.hostname, migration.hostname)) {
    throw new Error(
      "Staging migrate guard: DATABASE_URL and migration URL are not the aligned staging Neon pair.",
    );
  }

  return { skipped: false, runtimeHost: runtime.hostname, migrationHost: migration.hostname };
}

function enforceStagingMigrateGuardIfNeeded(env) {
  validateStagingMigrateGuard(env);
}

module.exports = {
  STAGING_VERCEL_PROJECT,
  STAGING_POOLED_HOST,
  STAGING_DIRECT_HOST,
  getDirectDatabaseUrl,
  parsePostgresHostname,
  isStagingVercelBuild,
  validateStagingMigrateGuard,
  enforceStagingMigrateGuardIfNeeded,
};
