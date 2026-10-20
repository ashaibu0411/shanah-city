/**
 * Marriage Playwright E2E isolation guard — negative and positive cases.
 * Run: npx.cmd tsx scripts/marriage-e2e-isolation-guard.test.ts
 */
import assert from "node:assert/strict";
import { join } from "node:path";
import {
  evaluateMarriageE2eIsolationGuard,
  isVerifiedMarriageE2eIsolation,
  shouldBypassAuthRateLimitForMarriageE2e,
  assertMarriageE2eIsolationSafeForDatabaseRouting,
} from "../src/lib/marriage-e2e-isolation-guard";
import { useDatabase } from "../src/lib/use-database";

type EnvSnapshot = Record<string, string | undefined>;

function snapshotEnv(keys: string[]): EnvSnapshot {
  const snap: EnvSnapshot = {};
  for (const key of keys) snap[key] = process.env[key];
  return snap;
}

function setEnv(key: string, value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env[key];
  else env[key] = value;
}

function restoreEnv(snap: EnvSnapshot) {
  for (const [key, value] of Object.entries(snap)) {
    setEnv(key, value);
  }
}

const ENV_KEYS = [
  "MARRIAGE_E2E_ISOLATED",
  "SHANAH_MARRIAGE_E2E_LOCAL",
  "MARRIAGE_E2E_BIND_HOST",
  "PORT",
  "E2E_PORT",
  "NODE_ENV",
  "VERCEL",
  "VERCEL_ENV",
  "AWS_LAMBDA_FUNCTION_NAME",
  "DATABASE_URL",
  "DIRECT_URL",
  "DIRECT_DATABASE_URL",
  "AUTH_DATA_DIR",
  "GROUPS_DATA_DIR",
  "MARRIAGE_COUNSELING_DATA_FILE",
  "MARRIAGE_CURRICULUM_DATA_FILE",
  "SHANAH_E2E_DISABLE_DATABASE",
];

function clearE2eEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

function applyVerifiedLocalPlaywrightEnv(cwd: string) {
  const dataDir = join(cwd, ".e2e-isolated", "data");
  process.env.MARRIAGE_E2E_ISOLATED = "1";
  process.env.SHANAH_MARRIAGE_E2E_LOCAL = "1";
  process.env.MARRIAGE_E2E_BIND_HOST = "127.0.0.1";
  process.env.SHANAH_E2E_DISABLE_DATABASE = "1";
  process.env.PORT = "3099";
  process.env.E2E_PORT = "3099";
  setEnv("NODE_ENV", "test");
  process.env.AUTH_DATA_DIR = dataDir;
  process.env.GROUPS_DATA_DIR = dataDir;
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dataDir, "marriage-counseling.json");
  process.env.MARRIAGE_CURRICULUM_DATA_FILE = join(dataDir, "marriage-curriculum.json");
  delete process.env.DATABASE_URL;
  delete process.env.DIRECT_URL;
  delete process.env.DIRECT_DATABASE_URL;
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
}

async function run() {
  const snap = snapshotEnv(ENV_KEYS);
  try {
    clearE2eEnv();
    assert.equal(evaluateMarriageE2eIsolationGuard().status, "inactive");
    assert.equal(isVerifiedMarriageE2eIsolation(), false);
    assert.equal(shouldBypassAuthRateLimitForMarriageE2e(), false);

    process.env.MARRIAGE_E2E_ISOLATED = "1";
    assert.equal(isVerifiedMarriageE2eIsolation(), false, "flag alone must not verify");
    assert.equal(shouldBypassAuthRateLimitForMarriageE2e(), false);

    clearE2eEnv();
    process.env.MARRIAGE_E2E_ISOLATED = "1";
    setEnv("NODE_ENV", "production");
    assert.equal(evaluateMarriageE2eIsolationGuard().status, "misconfigured");
    assert.match(
      (evaluateMarriageE2eIsolationGuard() as { reason: string }).reason,
      /production/i,
    );

    clearE2eEnv();
    process.env.MARRIAGE_E2E_ISOLATED = "1";
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "preview";
    assert.equal(evaluateMarriageE2eIsolationGuard().status, "misconfigured");

    clearE2eEnv();
    process.env.MARRIAGE_E2E_ISOLATED = "1";
    process.env.DATABASE_URL = "postgresql://example";
    assert.equal(evaluateMarriageE2eIsolationGuard().status, "misconfigured");

    clearE2eEnv();
    applyVerifiedLocalPlaywrightEnv(process.cwd());
    process.env.DATABASE_URL = "postgresql://leaked-from-dotenv";
    assert.equal(
      evaluateMarriageE2eIsolationGuard().status,
      "verified",
      "verified local E2E may ignore leaked DATABASE_URL when explicitly disabled",
    );

    clearE2eEnv();
    process.env.MARRIAGE_E2E_ISOLATED = "1";
    applyVerifiedLocalPlaywrightEnv(process.cwd());
    process.env.AUTH_DATA_DIR = join(process.cwd(), "data");
    assert.equal(evaluateMarriageE2eIsolationGuard().status, "misconfigured");

    clearE2eEnv();
    process.env.MARRIAGE_E2E_ISOLATED = "1";
    applyVerifiedLocalPlaywrightEnv(process.cwd());
    process.env.MARRIAGE_COUNSELING_DATA_FILE = join(process.cwd(), "data", "marriage-counseling.json");
    assert.equal(evaluateMarriageE2eIsolationGuard().status, "misconfigured");

    clearE2eEnv();
    applyVerifiedLocalPlaywrightEnv(process.cwd());
    assert.equal(evaluateMarriageE2eIsolationGuard().status, "verified");
    assert.equal(isVerifiedMarriageE2eIsolation(), true);
    assert.equal(shouldBypassAuthRateLimitForMarriageE2e(), true);
    assert.equal(useDatabase(), false);

    clearE2eEnv();
    process.env.MARRIAGE_E2E_ISOLATED = "1";
    process.env.DATABASE_URL = "postgresql://staging";
    assert.equal(evaluateMarriageE2eIsolationGuard().status, "misconfigured");
    assert.doesNotThrow(() => assertMarriageE2eIsolationSafeForDatabaseRouting());
    assert.equal(useDatabase(), true);

    clearE2eEnv();
    process.env.MARRIAGE_E2E_ISOLATED = "1";
    assert.throws(() => useDatabase(), /Misconfiguration|Remove MARRIAGE_E2E_ISOLATED/);

    clearE2eEnv();
    assert.equal(shouldBypassAuthRateLimitForMarriageE2e(), false);

    clearE2eEnv();
    process.env.MARRIAGE_E2E_ISOLATED = "1";
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "preview";
    process.env.DATABASE_URL = "postgresql://staging.example";
    process.env.SHANAH_E2E_DISABLE_DATABASE = "1";
    assert.equal(isVerifiedMarriageE2eIsolation(), false);
    assert.equal(shouldBypassAuthRateLimitForMarriageE2e(), false);
    assert.doesNotThrow(() => assertMarriageE2eIsolationSafeForDatabaseRouting());
    assert.equal(useDatabase(), true);

    console.log("marriage-e2e-isolation-guard.test.ts: all passed");
  } finally {
    restoreEnv(snap);
  }
}

void run();
