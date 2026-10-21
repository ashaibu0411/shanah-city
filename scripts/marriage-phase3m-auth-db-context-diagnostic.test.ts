/**
 * Phase 3M — auth database context diagnostic (no secrets in logs).
 */
import assert from "node:assert/strict";
import {
  buildPhase3mAuthDbContextDiagPayload,
  computeAuthDbLookupConsistent,
} from "../src/lib/marriage-phase3m-auth-db-context-diagnostic";
import {
  classifyDatabaseUrlTarget,
  isPhase3mDatabaseIdentityDiagnosticActive,
  setVerifiedStagingProjectIdForDatabaseIdentityTests,
} from "../src/lib/marriage-phase3m-database-identity-diagnostic";

const STAGING_PROJECT = "prj_staging_unit_test_verified";
const LIVE_PROJECT = "prj_live_unit_test_verified";

const STAGING_POOLED =
  "postgresql://redacted:redacted@ep-soft-flower-b89de4t0-pooler.c-14.us-east-1.aws.neon.tech/neondb?sslmode=require";
const PRODUCTION_POOLED =
  "postgresql://redacted:redacted@ep-young-glade-auv3jgsb-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";

const APPROVED_PAYLOAD_KEYS = [
  "authLookupSucceeded",
  "currentDatabase",
  "currentSchema",
  "databaseUrlClassification",
  "lookupConsistent",
  "sessionUserRowExists",
  "stagingProjectActive",
  "storageBackend",
  "tag",
].sort();

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

function testLookupConsistent() {
  assert.equal(computeAuthDbLookupConsistent(true, true), true);
  assert.equal(computeAuthDbLookupConsistent(true, false), false);
  assert.equal(computeAuthDbLookupConsistent(false, false), true);
  assert.equal(computeAuthDbLookupConsistent(false, true), false);
  assert.equal(computeAuthDbLookupConsistent(true, null), null);
  assert.equal(computeAuthDbLookupConsistent(false, null), null);
}

function testPayloadShapeAndClassification() {
  const payload = buildPhase3mAuthDbContextDiagPayload({
    storageBackend: "db",
    authLookupSucceeded: true,
    sessionUserRowExists: false,
    currentDatabase: "neondb",
    currentSchema: "public",
    databaseUrlClassification: "STAGING_DATABASE",
  });
  assert.deepEqual(Object.keys(payload).sort(), APPROVED_PAYLOAD_KEYS);
  assert.equal(payload.tag, "phase3m-auth-db-context-diag");
  assert.equal(payload.stagingProjectActive, true);
  assert.equal(payload.lookupConsistent, false);
  assert.equal(payload.databaseUrlClassification, "STAGING_DATABASE");
  assert.equal(classifyDatabaseUrlTarget(STAGING_POOLED), "STAGING_DATABASE");
  assert.equal(classifyDatabaseUrlTarget(PRODUCTION_POOLED), "PRODUCTION_DATABASE");
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
  } finally {
    setVerifiedStagingProjectIdForDatabaseIdentityTests(null);
    restoreEnv(saved);
  }
}

function testLogSafety() {
  const payload = buildPhase3mAuthDbContextDiagPayload({
    storageBackend: "db",
    authLookupSucceeded: true,
    sessionUserRowExists: true,
    currentDatabase: "neondb",
    currentSchema: "public",
    databaseUrlClassification: "STAGING_DATABASE",
  });
  const serialized = JSON.stringify(payload);
  assert.doesNotMatch(serialized, /postgresql/i);
  assert.doesNotMatch(serialized, /1792541244421/);
  assert.doesNotMatch(serialized, /ep-soft-flower/i);
  assert.doesNotMatch(serialized, /ep-young-glade/i);
  assert.doesNotMatch(serialized, /@/);
  assert.doesNotMatch(serialized, /token/i);
  assert.doesNotMatch(serialized, /email/i);
}

async function main() {
  testLookupConsistent();
  testPayloadShapeAndClassification();
  testActivationGuard();
  testLogSafety();
  console.log("marriage-phase3m-auth-db-context-diagnostic.test.ts: all passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
