/**
 * Phase 3M — database identity diagnostic (no secrets in logs).
 */
import assert from "node:assert/strict";
import {
  buildPhase3mDatabaseIdentityDiagPayload,
  classifyDatabaseUrlTarget,
  isPhase3mDatabaseIdentityDiagnosticActive,
  logPhase3mDatabaseIdentityDiagnosticOnce,
  resetPhase3mDatabaseIdentityDiagnosticLogForTests,
  setVerifiedStagingProjectIdForDatabaseIdentityTests,
} from "../src/lib/marriage-phase3m-database-identity-diagnostic";

const STAGING_PROJECT = "prj_staging_unit_test_verified";
const LIVE_PROJECT = "prj_live_unit_test_verified";

const STAGING_POOLED =
  "postgresql://redacted:redacted@ep-soft-flower-b89de4t0-pooler.c-14.us-east-1.aws.neon.tech/neondb?sslmode=require";
const STAGING_DIRECT =
  "postgresql://redacted:redacted@ep-soft-flower-b89de4t0.c-14.us-east-1.aws.neon.tech/neondb?sslmode=require";
const PRODUCTION_POOLED =
  "postgresql://redacted:redacted@ep-young-glade-auv3jgsb-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";
const PRODUCTION_DIRECT =
  "postgresql://redacted:redacted@ep-young-glade-auv3jgsb.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";

function saveEnv() {
  return {
    projectId: process.env.VERCEL_PROJECT_ID,
    projectName: process.env.VERCEL_PROJECT_NAME,
    databaseUrl: process.env.DATABASE_URL,
  };
}

function restoreEnv(saved: ReturnType<typeof saveEnv>) {
  if (saved.projectId !== undefined) process.env.VERCEL_PROJECT_ID = saved.projectId;
  else delete process.env.VERCEL_PROJECT_ID;
  if (saved.projectName !== undefined) process.env.VERCEL_PROJECT_NAME = saved.projectName;
  else delete process.env.VERCEL_PROJECT_NAME;
  if (saved.databaseUrl !== undefined) process.env.DATABASE_URL = saved.databaseUrl;
  else delete process.env.DATABASE_URL;
}

function testClassification() {
  assert.equal(classifyDatabaseUrlTarget(""), "DATABASE_NOT_CONFIGURED");
  assert.equal(classifyDatabaseUrlTarget(undefined), "DATABASE_NOT_CONFIGURED");
  assert.equal(classifyDatabaseUrlTarget(STAGING_POOLED), "STAGING_DATABASE");
  assert.equal(classifyDatabaseUrlTarget(STAGING_DIRECT), "STAGING_DATABASE");
  assert.equal(classifyDatabaseUrlTarget(PRODUCTION_POOLED), "PRODUCTION_DATABASE");
  assert.equal(classifyDatabaseUrlTarget(PRODUCTION_DIRECT), "PRODUCTION_DATABASE");
  assert.equal(
    classifyDatabaseUrlTarget(
      "postgresql://x@ep-unknown-example.c-14.us-east-1.aws.neon.tech/neondb",
    ),
    "UNKNOWN_DATABASE",
  );
  assert.equal(
    classifyDatabaseUrlTarget(
      "postgresql://x@ep-soft-flower-b89de4t0-pooler.c-14.us-east-1.aws.neon.tech/wrongdb",
    ),
    "UNKNOWN_DATABASE",
  );
}

function testActivationGuard() {
  const saved = saveEnv();
  setVerifiedStagingProjectIdForDatabaseIdentityTests(STAGING_PROJECT);
  try {
    process.env.VERCEL_PROJECT_ID = STAGING_PROJECT;
    process.env.VERCEL_PROJECT_NAME = "shanah-city-staging";
    assert.equal(isPhase3mDatabaseIdentityDiagnosticActive(), true);

    process.env.VERCEL_PROJECT_ID = LIVE_PROJECT;
    assert.equal(isPhase3mDatabaseIdentityDiagnosticActive(), false);

    process.env.VERCEL_PROJECT_ID = STAGING_PROJECT;
    process.env.VERCEL_PROJECT_NAME = "shanah-city";
    assert.equal(isPhase3mDatabaseIdentityDiagnosticActive(), false);

    process.env.VERCEL_PROJECT_NAME = "shanah-city-staging";
    delete process.env.VERCEL_PROJECT_ID;
    assert.equal(isPhase3mDatabaseIdentityDiagnosticActive(), false);
  } finally {
    setVerifiedStagingProjectIdForDatabaseIdentityTests(null);
    restoreEnv(saved);
  }
}

function testLoggingWhenInactive() {
  const saved = saveEnv();
  setVerifiedStagingProjectIdForDatabaseIdentityTests(STAGING_PROJECT);
  resetPhase3mDatabaseIdentityDiagnosticLogForTests();
  const lines: string[] = [];
  const original = console.info;
  console.info = (msg?: unknown) => {
    if (typeof msg === "string") lines.push(msg);
  };
  try {
    process.env.VERCEL_PROJECT_ID = LIVE_PROJECT;
    process.env.DATABASE_URL = STAGING_POOLED;
    logPhase3mDatabaseIdentityDiagnosticOnce();
    assert.equal(lines.length, 0);
  } finally {
    console.info = original;
    setVerifiedStagingProjectIdForDatabaseIdentityTests(null);
    resetPhase3mDatabaseIdentityDiagnosticLogForTests();
    restoreEnv(saved);
  }
}

function testLoggingWhenActiveNoSecrets() {
  const saved = saveEnv();
  setVerifiedStagingProjectIdForDatabaseIdentityTests(STAGING_PROJECT);
  resetPhase3mDatabaseIdentityDiagnosticLogForTests();
  const lines: string[] = [];
  const original = console.info;
  console.info = (msg?: unknown) => {
    if (typeof msg === "string") lines.push(msg);
  };
  try {
    process.env.VERCEL_PROJECT_ID = STAGING_PROJECT;
    process.env.VERCEL_PROJECT_NAME = "shanah-city-staging";
    process.env.DATABASE_URL = PRODUCTION_POOLED;
    logPhase3mDatabaseIdentityDiagnosticOnce();
    logPhase3mDatabaseIdentityDiagnosticOnce();
    assert.equal(lines.length, 1);

    const payload = JSON.parse(lines[0]!) as Record<string, unknown>;
    assert.deepEqual(Object.keys(payload).sort(), ["classification", "tag"]);
    assert.equal(payload.tag, "phase3m-database-identity-diag");
    assert.equal(payload.classification, "PRODUCTION_DATABASE");

    const serialized = lines[0]!;
    assert.doesNotMatch(serialized, /postgresql/i);
    assert.doesNotMatch(serialized, /redacted/i);
    assert.doesNotMatch(serialized, /ep-soft-flower/i);
    assert.doesNotMatch(serialized, /ep-young-glade/i);
  } finally {
    console.info = original;
    setVerifiedStagingProjectIdForDatabaseIdentityTests(null);
    resetPhase3mDatabaseIdentityDiagnosticLogForTests();
    restoreEnv(saved);
  }
}

function testPayloadShape() {
  const payload = buildPhase3mDatabaseIdentityDiagPayload("STAGING_DATABASE");
  assert.equal(payload.tag, "phase3m-database-identity-diag");
  assert.equal(payload.classification, "STAGING_DATABASE");
}

async function main() {
  testClassification();
  testActivationGuard();
  testLoggingWhenInactive();
  testLoggingWhenActiveNoSecrets();
  testPayloadShape();
  console.log("marriage-phase3m-database-identity-diagnostic.test.ts: all passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
