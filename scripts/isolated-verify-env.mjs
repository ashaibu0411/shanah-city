/**
 * Env for local Marriage Prep verify — no production/staging Neon connections.
 * Strips DATABASE_URL so build skips prisma migrate deploy (see build-migrate-guard).
 */
export function isolatedVerifyEnv(base = process.env) {
  const env = { ...base };
  delete env.DATABASE_URL;
  delete env.DIRECT_URL;
  delete env.DIRECT_DATABASE_URL;
  delete env.VERCEL;
  delete env.VERCEL_ENV;
  delete env.VERCEL_PROJECT_NAME;
  delete env.VERCEL_URL;
  delete env.VERCEL_GIT_COMMIT_SHA;
  delete env.STAGING_MIGRATE_GUARD;
  env.USE_DATABASE = "0";
  env.MARRIAGE_E2E_ISOLATED = "1";
  return env;
}
