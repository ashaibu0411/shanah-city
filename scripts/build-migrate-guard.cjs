/**
 * Fail-closed Prisma migrate guards for Vercel staging and production.
 * Hostnames are exact Neon endpoint IDs (not substring prefix checks).
 */
const STAGING_VERCEL_PROJECT = "shanah-city-staging";
const PRODUCTION_VERCEL_PROJECT = "shanah-city";

/** Staging Neon late-moon-18456188 — pooled runtime endpoint (c-14; pooler hostname pending independent verification). */
const STAGING_POOLED_HOST =
  "ep-soft-flower-b89de4t0-pooler.c-14.us-east-1.aws.neon.tech";

/** Staging Neon — direct (unpooled) migrate endpoint (confirmed). */
const STAGING_DIRECT_HOST = "ep-soft-flower-b89de4t0.c-14.us-east-1.aws.neon.tech";

/** Production Neon shanah-city-db — pooled runtime endpoint. */
const PRODUCTION_POOLED_HOST =
  "ep-young-glade-auv3jgsb-pooler.c-10.us-east-1.aws.neon.tech";

/** Production Neon — direct (unpooled) migrate endpoint. */
const PRODUCTION_DIRECT_HOST = "ep-young-glade-auv3jgsb.c-10.us-east-1.aws.neon.tech";

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

function isLocalhostHostname(hostname) {
  if (!hostname) {
    return false;
  }
  const h = hostname.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".localhost");
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

/** Compare pooled vs direct for the two known production endpoints only. */
function productionEndpointsAligned(pooledHost, directHost) {
  if (pooledHost === PRODUCTION_POOLED_HOST && directHost === PRODUCTION_DIRECT_HOST) {
    return true;
  }
  const depooled = pooledHost.includes("-pooler.")
    ? pooledHost.replace("-pooler.", ".")
    : pooledHost.includes("-pooler")
      ? pooledHost.replace("-pooler", "")
      : pooledHost;
  return depooled === directHost && directHost === PRODUCTION_DIRECT_HOST;
}

function assertDirectUrlAliasesConsistent(env, label) {
  const directUrl = env.DIRECT_URL?.trim();
  const directDatabaseUrl = env.DIRECT_DATABASE_URL?.trim();
  if (!directUrl || !directDatabaseUrl) {
    return;
  }
  const a = parsePostgresHostname(directUrl);
  const b = parsePostgresHostname(directDatabaseUrl);
  if (!a.ok) {
    throw new Error(`${label}: DIRECT_URL invalid (${a.reason}).`);
  }
  if (!b.ok) {
    throw new Error(`${label}: DIRECT_DATABASE_URL invalid (${b.reason}).`);
  }
  if (a.hostname !== b.hostname) {
    throw new Error(
      `${label}: DIRECT_URL and DIRECT_DATABASE_URL must target the same host (got ${a.hostname} vs ${b.hostname}).`,
    );
  }
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

function isProductionVercelBuild(env) {
  if (env.VERCEL !== "1") {
    return false;
  }
  if (env.VERCEL_PROJECT_NAME?.trim() !== PRODUCTION_VERCEL_PROJECT) {
    return false;
  }
  return env.VERCEL_ENV?.trim() === "production";
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

  assertDirectUrlAliasesConsistent(env, "Staging migrate guard");

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

  if (isLocalhostHostname(runtime.hostname) || isLocalhostHostname(migration.hostname)) {
    throw new Error("Staging migrate guard: localhost database targets are not allowed.");
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

/**
 * Validates production migrate targets. Uses getDirectDatabaseUrl() so checks match prisma.config.ts / build.cjs migrate subprocess.
 * @param {NodeJS.ProcessEnv} env
 */
function validateProductionMigrateGuard(env) {
  if (!isProductionVercelBuild(env)) {
    return { skipped: true };
  }

  assertDirectUrlAliasesConsistent(env, "Production migrate guard");

  const runtimeRaw = env.DATABASE_URL?.trim();
  if (!runtimeRaw) {
    throw new Error("Production migrate guard: DATABASE_URL is required for shanah-city production builds.");
  }

  const migrationRaw = getDirectDatabaseUrl(env);
  if (!migrationRaw) {
    throw new Error(
      "Production migrate guard: a migration URL is required (DIRECT_URL, DIRECT_DATABASE_URL, or depooled DATABASE_URL).",
    );
  }

  const runtime = parsePostgresHostname(runtimeRaw);
  if (!runtime.ok) {
    throw new Error(`Production migrate guard: DATABASE_URL invalid (${runtime.reason}).`);
  }

  const migration = parsePostgresHostname(migrationRaw);
  if (!migration.ok) {
    throw new Error(`Production migrate guard: migration URL invalid (${migration.reason}).`);
  }

  if (isLocalhostHostname(runtime.hostname) || isLocalhostHostname(migration.hostname)) {
    throw new Error("Production migrate guard: localhost database targets are not allowed.");
  }

  if (
    runtime.hostname === STAGING_POOLED_HOST ||
    runtime.hostname === STAGING_DIRECT_HOST ||
    migration.hostname === STAGING_POOLED_HOST ||
    migration.hostname === STAGING_DIRECT_HOST
  ) {
    throw new Error("Production migrate guard: staging Neon endpoints are not allowed in production.");
  }

  if (runtime.hostname !== PRODUCTION_POOLED_HOST) {
    throw new Error(
      `Production migrate guard: DATABASE_URL must use production pooled host ${PRODUCTION_POOLED_HOST} (got ${runtime.hostname}).`,
    );
  }

  if (migration.hostname !== PRODUCTION_DIRECT_HOST) {
    throw new Error(
      `Production migrate guard: migration URL must use production direct host ${PRODUCTION_DIRECT_HOST} (got ${migration.hostname}).`,
    );
  }

  if (!productionEndpointsAligned(runtime.hostname, migration.hostname)) {
    throw new Error(
      "Production migrate guard: DATABASE_URL and migration URL are not the aligned production Neon pair.",
    );
  }

  return { skipped: false, runtimeHost: runtime.hostname, migrationHost: migration.hostname };
}

function enforceStagingMigrateGuardIfNeeded(env) {
  validateStagingMigrateGuard(env);
}

function enforceProductionMigrateGuardIfNeeded(env) {
  validateProductionMigrateGuard(env);
}

function isVercelPreviewBuild(env) {
  return env.VERCEL === "1" && env.VERCEL_ENV?.trim() === "preview";
}

/**
 * Decides whether build.cjs should run `prisma migrate deploy`.
 * Vercel preview builds never migrate (checked before URL selection).
 * @param {NodeJS.ProcessEnv} env
 * @returns {{ run: false, reason: "vercel_preview" | "database_url_unset" } | { run: true, mode: "direct", directUrl: string } | { run: true, mode: "pooled" }}
 */
function resolvePrismaMigrateDeployPlan(env) {
  if (isVercelPreviewBuild(env)) {
    return { run: false, reason: "vercel_preview" };
  }

  const directUrl = getDirectDatabaseUrl(env);
  if (directUrl) {
    return { run: true, mode: "direct", directUrl };
  }
  if (env.DATABASE_URL?.trim()) {
    return { run: true, mode: "pooled" };
  }
  return { run: false, reason: "database_url_unset" };
}

module.exports = {
  STAGING_VERCEL_PROJECT,
  STAGING_POOLED_HOST,
  STAGING_DIRECT_HOST,
  PRODUCTION_VERCEL_PROJECT,
  PRODUCTION_POOLED_HOST,
  PRODUCTION_DIRECT_HOST,
  getDirectDatabaseUrl,
  parsePostgresHostname,
  isStagingVercelBuild,
  isProductionVercelBuild,
  validateStagingMigrateGuard,
  validateProductionMigrateGuard,
  enforceStagingMigrateGuardIfNeeded,
  enforceProductionMigrateGuardIfNeeded,
  isVercelPreviewBuild,
  resolvePrismaMigrateDeployPlan,
};
