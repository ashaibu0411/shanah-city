/**
 * build-migrate-guard — no database connections.
 * Run: node scripts/build-migrate-guard.test.mjs
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  STAGING_POOLED_HOST,
  STAGING_DIRECT_HOST,
  PRODUCTION_POOLED_HOST,
  PRODUCTION_DIRECT_HOST,
  validateStagingMigrateGuard,
  validateProductionMigrateGuard,
  validateManualStagingMigrateDeploy,
  EXPECTED_DATABASE_NAME,
  parsePostgresConnectionTarget,
  isStagingVercelBuild,
  isProductionVercelBuild,
  isVercelPreviewBuild,
  resolvePrismaMigrateDeployPlan,
} = require("./build-migrate-guard.cjs");

const PROD_POOLED = PRODUCTION_POOLED_HOST;
const PROD_DIRECT = PRODUCTION_DIRECT_HOST;

/** Legacy c-10 staging hostnames must not pass after c-14 correction */
const STAGING_POOLED_C10 = "ep-soft-flower-b89de4t0-pooler.c-10.us-east-1.aws.neon.tech";
const STAGING_DIRECT_C10 = "ep-soft-flower-b89de4t0.c-10.us-east-1.aws.neon.tech";

function url(host, database = EXPECTED_DATABASE_NAME) {
  return `postgresql://neondb_owner:REDACTED@${host}/${database}?sslmode=require`;
}

const stagingEnv = {
  VERCEL: "1",
  VERCEL_PROJECT_NAME: "shanah-city-staging",
  DATABASE_URL: url(STAGING_POOLED_HOST),
  DIRECT_URL: url(STAGING_DIRECT_HOST),
};

assert.equal(isStagingVercelBuild(stagingEnv), true);
assert.equal(
  validateStagingMigrateGuard(stagingEnv).skipped,
  false,
  "correct staging URLs pass",
);

assert.equal(
  isStagingVercelBuild({
    VERCEL: "1",
    STAGING_MIGRATE_GUARD: "1",
  }),
  true,
  "STAGING_MIGRATE_GUARD=1 activates guard",
);

assert.equal(
  validateStagingMigrateGuard({
    VERCEL: "1",
    STAGING_MIGRATE_GUARD: "1",
    DATABASE_URL: url(STAGING_POOLED_HOST),
    DIRECT_URL: url(STAGING_DIRECT_HOST),
  }).skipped,
  false,
  "guard flag without VERCEL_PROJECT_NAME passes with correct URLs",
);

assert.throws(
  () =>
    validateStagingMigrateGuard({
      VERCEL: "1",
      STAGING_MIGRATE_GUARD: "1",
      VERCEL_PROJECT_NAME: "shanah-city",
      DATABASE_URL: url(STAGING_POOLED_HOST),
      DIRECT_URL: url(STAGING_DIRECT_HOST),
    }),
  /STAGING_MIGRATE_GUARD=1 but VERCEL_PROJECT_NAME/,
  "conflicting project identity rejected before URL checks",
);

assert.throws(
  () =>
    validateStagingMigrateGuard({
      ...stagingEnv,
      DATABASE_URL: url(PROD_POOLED),
    }),
  /production Neon endpoints are not allowed|staging pooled host/,
  "production runtime URL rejected",
);

assert.throws(
  () =>
    validateStagingMigrateGuard({
      ...stagingEnv,
      DIRECT_URL: url(PROD_DIRECT),
    }),
  /production Neon endpoints are not allowed|migration URL must use staging direct host/,
  "production migrate URL rejected",
);

assert.throws(
  () =>
    validateStagingMigrateGuard({
      ...stagingEnv,
      DATABASE_URL: url(STAGING_POOLED_HOST),
      DIRECT_URL: url(PROD_DIRECT),
    }),
  /production Neon endpoints are not allowed|migration URL must use staging direct host/,
  "split-brain rejected",
);

assert.throws(
  () =>
    validateStagingMigrateGuard({
      ...stagingEnv,
      DATABASE_URL: url(STAGING_POOLED_C10),
      DIRECT_URL: url(STAGING_DIRECT_C10),
    }),
  /staging pooled host/,
  "legacy c-10 staging hostnames rejected",
);

assert.throws(
  () =>
    validateStagingMigrateGuard({
      ...stagingEnv,
      DATABASE_URL: undefined,
    }),
  /DATABASE_URL is required/,
  "missing DATABASE_URL",
);

assert.throws(
  () =>
    validateStagingMigrateGuard({
      ...stagingEnv,
      DIRECT_URL: undefined,
      DATABASE_URL: url(STAGING_POOLED_HOST),
    }),
  /DIRECT_URL must be set explicitly/,
  "missing DIRECT_URL",
);

assert.throws(
  () =>
    validateStagingMigrateGuard({
      ...stagingEnv,
      DATABASE_URL: "not-a-url",
    }),
  /DATABASE_URL invalid/,
  "malformed runtime URL",
);

assert.equal(
  validateStagingMigrateGuard({
    VERCEL: "1",
    VERCEL_PROJECT_NAME: "shanah-city",
    DATABASE_URL: url(PROD_POOLED),
    DIRECT_URL: url(PROD_DIRECT),
  }).skipped,
  true,
  "production Vercel project skips guard",
);

assert.equal(
  validateStagingMigrateGuard({
    VERCEL: "1",
    VERCEL_URL: "shanah-city-staging.vercel.app",
    NEXT_PUBLIC_APP_URL: "https://shanah-city-staging.vercel.app",
    DATABASE_URL: url(PROD_POOLED),
    DIRECT_URL: url(PROD_DIRECT),
  }).skipped,
  true,
  "URL hints alone do not activate guard",
);

assert.equal(
  isStagingVercelBuild({
    VERCEL: "1",
    VERCEL_URL: "shanah-city-staging.vercel.app",
  }),
  false,
  "isStagingVercelBuild ignores VERCEL_URL",
);

assert.throws(
  () =>
    validateStagingMigrateGuard({
      VERCEL: "1",
      VERCEL_PROJECT_NAME: "shanah-city-staging",
      DATABASE_URL: url(PROD_POOLED),
      DIRECT_URL: url(PROD_DIRECT),
    }),
  /production Neon endpoints are not allowed|staging pooled host/,
  "staging project with production URLs rejected",
);

assert.throws(
  () =>
    validateStagingMigrateGuard({
      VERCEL: "1",
      STAGING_MIGRATE_GUARD: "1",
      DATABASE_URL: url(PROD_POOLED),
      DIRECT_URL: url(PROD_DIRECT),
    }),
  /production Neon endpoints are not allowed|staging pooled host/,
  "guard flag with production URLs rejected",
);

assert.throws(
  () =>
    validateStagingMigrateGuard({
      ...stagingEnv,
      DATABASE_URL: url("ep-soft-flower-b89de4t0.evil.example.com"),
    }),
  /staging pooled host/,
  "prefix-only hostname not allowed",
);

const productionEnv = {
  VERCEL: "1",
  VERCEL_PROJECT_NAME: "shanah-city",
  VERCEL_ENV: "production",
  DATABASE_URL: url(PROD_POOLED),
  DIRECT_URL: url(PROD_DIRECT),
};

assert.equal(isProductionVercelBuild(productionEnv), true);
assert.equal(
  validateProductionMigrateGuard(productionEnv).skipped,
  false,
  "valid production pooled/direct pairing passes",
);

assert.equal(
  validateProductionMigrateGuard({
    VERCEL: "1",
    VERCEL_PROJECT_NAME: "shanah-city",
    VERCEL_ENV: "production",
    DATABASE_URL: url(PROD_POOLED),
  }).skipped,
  false,
  "production fallback depools DATABASE_URL when direct aliases absent",
);

assert.equal(
  validateProductionMigrateGuard({
    VERCEL: "1",
    VERCEL_PROJECT_NAME: "shanah-city",
    VERCEL_ENV: "production",
    DATABASE_URL: url(PROD_POOLED),
    DIRECT_DATABASE_URL: url(PROD_DIRECT),
  }).skipped,
  false,
  "production accepts DIRECT_DATABASE_URL when DIRECT_URL unset",
);

assert.throws(
  () =>
    validateProductionMigrateGuard({
      ...productionEnv,
      DATABASE_URL: url(STAGING_POOLED_HOST),
      DIRECT_URL: url(STAGING_DIRECT_HOST),
    }),
  /staging Neon endpoints are not allowed/,
  "staging URLs rejected in production",
);

assert.throws(
  () =>
    validateProductionMigrateGuard({
      ...productionEnv,
      DATABASE_URL: url(PROD_POOLED),
      DIRECT_URL: url(STAGING_DIRECT_HOST),
    }),
  /staging Neon endpoints are not allowed/,
  "staging direct override rejected in production",
);

assert.throws(
  () =>
    validateProductionMigrateGuard({
      ...productionEnv,
      DATABASE_URL: "postgresql://user:pass@localhost:5432/shanah_city",
      DIRECT_URL: url(PROD_DIRECT),
    }),
  /localhost database targets are not allowed/,
  "localhost runtime rejected in production",
);

assert.throws(
  () =>
    validateProductionMigrateGuard({
      ...productionEnv,
      DATABASE_URL: url(PROD_POOLED),
      DIRECT_URL: "postgresql://user:pass@127.0.0.1:5432/shanah_city",
    }),
  /localhost database targets are not allowed/,
  "127.0.0.1 migrate target rejected in production",
);

assert.throws(
  () =>
    validateProductionMigrateGuard({
      ...productionEnv,
      DATABASE_URL: undefined,
    }),
  /DATABASE_URL is required/,
  "missing DATABASE_URL rejected in production",
);

assert.throws(
  () =>
    validateProductionMigrateGuard({
      ...productionEnv,
      DATABASE_URL: "not-a-url",
    }),
  /DATABASE_URL invalid/,
  "malformed DATABASE_URL rejected in production",
);

assert.throws(
  () =>
    validateProductionMigrateGuard({
      ...productionEnv,
      DIRECT_URL: url(PROD_DIRECT),
      DIRECT_DATABASE_URL: url(STAGING_DIRECT_HOST),
    }),
  /DIRECT_URL and DIRECT_DATABASE_URL must target the same host/,
  "conflicting direct URL aliases rejected in production",
);

assert.throws(
  () =>
    validateStagingMigrateGuard({
      VERCEL: "1",
      VERCEL_PROJECT_NAME: "shanah-city-staging",
      DATABASE_URL: url(PROD_POOLED),
      DIRECT_URL: url(PROD_DIRECT),
    }),
  /production Neon endpoints are not allowed|staging pooled host/,
  "production URLs rejected by staging guard",
);

assert.equal(
  validateProductionMigrateGuard({
    VERCEL: "1",
    VERCEL_PROJECT_NAME: "shanah-city",
    VERCEL_ENV: "preview",
    DATABASE_URL: url(PROD_POOLED),
    DIRECT_URL: url(PROD_DIRECT),
  }).skipped,
  true,
  "preview builds skip production migrate guard",
);

assert.equal(
  isProductionVercelBuild({
    VERCEL: "1",
    VERCEL_PROJECT_NAME: "shanah-city",
    VERCEL_ENV: "preview",
  }),
  false,
  "preview is not a production Vercel build",
);

assert.throws(
  () =>
    validateProductionMigrateGuard({
      ...productionEnv,
      DATABASE_URL: url("ep-young-glade-auv3jgsb.evil.example.com"),
    }),
  /production pooled host/,
  "unexpected hostname with production prefix rejected",
);

const previewBase = {
  VERCEL: "1",
  VERCEL_ENV: "preview",
};

function assertPreviewSkipsMigrate(env, label) {
  assert.equal(isVercelPreviewBuild(env), true, `${label}: preview build detected`);
  const plan = resolvePrismaMigrateDeployPlan(env);
  assert.equal(plan.run, false, `${label}: migrate not scheduled`);
  assert.equal(plan.reason, "vercel_preview", `${label}: skip reason is vercel_preview`);
}

assertPreviewSkipsMigrate(
  {
    ...previewBase,
    VERCEL_PROJECT_NAME: "shanah-city",
    DATABASE_URL: url(PROD_POOLED),
    DIRECT_URL: url(PROD_DIRECT),
  },
  "preview with production URLs",
);

assertPreviewSkipsMigrate(
  {
    ...previewBase,
    VERCEL_PROJECT_NAME: "shanah-city-staging",
    DATABASE_URL: url(STAGING_POOLED_HOST),
    DIRECT_URL: url(STAGING_DIRECT_HOST),
  },
  "preview with staging URLs",
);

assertPreviewSkipsMigrate(
  {
    ...previewBase,
    VERCEL_PROJECT_NAME: "shanah-city",
    DATABASE_URL: "not-a-url",
    DIRECT_URL: url(PROD_DIRECT),
  },
  "preview with malformed DATABASE_URL",
);

assertPreviewSkipsMigrate(
  {
    ...previewBase,
    VERCEL_PROJECT_NAME: "shanah-city-staging",
  },
  "preview with missing database URLs",
);

assertPreviewSkipsMigrate(
  {
    ...previewBase,
    VERCEL_PROJECT_NAME: "shanah-city",
    DATABASE_URL: url(PROD_POOLED),
    DIRECT_DATABASE_URL: url(PROD_DIRECT),
  },
  "preview with DIRECT_DATABASE_URL only path",
);

assert.deepEqual(
  resolvePrismaMigrateDeployPlan({
    VERCEL: "1",
    VERCEL_PROJECT_NAME: "shanah-city",
    VERCEL_ENV: "production",
    DATABASE_URL: url(PROD_POOLED),
    DIRECT_URL: url(PROD_DIRECT),
  }),
  { run: true, mode: "direct", directUrl: url(PROD_DIRECT) },
  "production Vercel build still schedules migrate with direct URL",
);

assert.deepEqual(
  resolvePrismaMigrateDeployPlan({
    DATABASE_URL: url(PROD_POOLED),
    DIRECT_URL: url(PROD_DIRECT),
  }),
  { run: true, mode: "direct", directUrl: url(PROD_DIRECT) },
  "local build still schedules migrate when URLs are set",
);

assert.deepEqual(
  resolvePrismaMigrateDeployPlan({}),
  { run: false, reason: "database_url_unset" },
  "local build without DATABASE_URL skips migrate",
);

assert.throws(
  () =>
    validateStagingMigrateGuard({
      ...stagingEnv,
      DATABASE_URL: url(STAGING_POOLED_HOST, "shanah_city"),
    }),
  /must use database neondb/,
  "staging guard rejects wrong DATABASE_URL database name",
);

assert.throws(
  () =>
    validateStagingMigrateGuard({
      ...stagingEnv,
      DATABASE_URL: url(STAGING_POOLED_HOST),
      DIRECT_URL: url(STAGING_DIRECT_HOST, "otherdb"),
    }),
  /must target the same database|must use database neondb/,
  "staging guard rejects mismatched URL path databases",
);

assert.throws(
  () =>
    validateProductionMigrateGuard({
      VERCEL: "1",
      VERCEL_PROJECT_NAME: "shanah-city",
      VERCEL_ENV: "production",
      DATABASE_URL: url(PROD_POOLED, "production"),
      DIRECT_URL: url(PROD_DIRECT),
    }),
  /must use database neondb/,
  "production guard rejects wrong database name",
);

const manualStagingBase = {
  STAGING_DATABASE_CONFIRM: "shanah-city-staging",
  DATABASE_URL: url(STAGING_POOLED_HOST),
  DIRECT_URL: url(STAGING_DIRECT_HOST),
};

assert.deepEqual(
  validateManualStagingMigrateDeploy(manualStagingBase).database,
  EXPECTED_DATABASE_NAME,
  "manual staging migrate accepts valid staging configuration",
);

assert.throws(
  () =>
    validateManualStagingMigrateDeploy({
      ...manualStagingBase,
      DATABASE_URL: url(PROD_POOLED),
      DIRECT_URL: url(PROD_DIRECT),
    }),
  /production Neon endpoints are not allowed/,
  "manual staging migrate rejects production hostnames",
);

assert.throws(
  () =>
    validateManualStagingMigrateDeploy({
      ...manualStagingBase,
      DATABASE_URL: "postgresql://user:REDACTED@localhost:5432/neondb",
    }),
  /localhost database targets are not allowed/,
  "manual staging migrate rejects localhost",
);

assert.throws(
  () =>
    validateManualStagingMigrateDeploy({
      STAGING_DATABASE_CONFIRM: "shanah-city-staging",
      DATABASE_URL: url(STAGING_POOLED_HOST),
    }),
  /DIRECT_URL must be set explicitly/,
  "manual staging migrate rejects missing DIRECT_URL",
);

assert.throws(
  () =>
    validateManualStagingMigrateDeploy({
      ...manualStagingBase,
      DIRECT_URL: url(STAGING_DIRECT_HOST),
      DIRECT_DATABASE_URL: url(STAGING_DIRECT_HOST, "wrongdb"),
    }),
  /must target the same database/,
  "manual staging migrate rejects conflicting direct URL databases",
);

assert.throws(
  () =>
    validateManualStagingMigrateDeploy({
      DATABASE_URL: url(STAGING_POOLED_HOST),
      DIRECT_URL: url(STAGING_DIRECT_HOST),
    }),
  /STAGING_DATABASE_CONFIRM/,
  "manual staging migrate requires confirmation flag",
);

assert.equal(
  parsePostgresConnectionTarget(url(STAGING_POOLED_HOST)).database,
  "neondb",
  "parsePostgresConnectionTarget reads database from path",
);

console.log("build-migrate-guard.test.mjs: OK");
