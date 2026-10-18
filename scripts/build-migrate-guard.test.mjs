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
  validateStagingMigrateGuard,
  isStagingVercelBuild,
} = require("./build-migrate-guard.cjs");

const PROD_POOLED = "ep-young-glade-auv3jgsb-pooler.c-10.us-east-1.aws.neon.tech";
const PROD_DIRECT = "ep-young-glade-auv3jgsb.c-10.us-east-1.aws.neon.tech";

/** Legacy c-10 staging hostnames must not pass after c-14 correction */
const STAGING_POOLED_C10 = "ep-soft-flower-b89de4t0-pooler.c-10.us-east-1.aws.neon.tech";
const STAGING_DIRECT_C10 = "ep-soft-flower-b89de4t0.c-10.us-east-1.aws.neon.tech";

function url(host) {
  return `postgresql://neondb_owner:REDACTED@${host}/neondb?sslmode=require`;
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
  /DATABASE_URL must use staging pooled host/,
  "production runtime URL rejected",
);

assert.throws(
  () =>
    validateStagingMigrateGuard({
      ...stagingEnv,
      DIRECT_URL: url(PROD_DIRECT),
    }),
  /migration URL must use staging direct host/,
  "production migrate URL rejected",
);

assert.throws(
  () =>
    validateStagingMigrateGuard({
      ...stagingEnv,
      DATABASE_URL: url(STAGING_POOLED_HOST),
      DIRECT_URL: url(PROD_DIRECT),
    }),
  /migration URL must use staging direct host/,
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
  /staging pooled host/,
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
  /staging pooled host/,
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

console.log("build-migrate-guard.test.mjs: OK");
