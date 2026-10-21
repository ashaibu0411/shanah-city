/**
 * Phase 3M — staging diagnostic gate + payloads (no PII in logs).
 */
import assert from "node:assert/strict";
import {
  buildPhase3mUserLookupDiagPayload,
  isPhase3mAssignmentDisplayDiagnosticActive,
  setVerifiedStagingProjectIdForTests,
} from "../src/lib/marriage-phase3m-assignment-display-diagnostic";

const STAGING_PROJECT = "prj_staging_unit_test_verified";
const LIVE_PROJECT = "prj_live_unit_test_verified";

/** Tests mutate env; Node types mark NODE_ENV read-only. */
const env = process.env as Record<string, string | undefined>;

function saveEnv() {
  return {
    ref: process.env.VERCEL_GIT_COMMIT_REF,
    projectId: process.env.VERCEL_PROJECT_ID,
    diag: process.env.PHASE3M_ASSIGNMENT_DISPLAY_DIAG,
    nodeEnv: env.NODE_ENV,
  };
}

function restoreEnv(saved: ReturnType<typeof saveEnv>) {
  if (saved.ref !== undefined) process.env.VERCEL_GIT_COMMIT_REF = saved.ref;
  else delete process.env.VERCEL_GIT_COMMIT_REF;
  if (saved.projectId !== undefined) process.env.VERCEL_PROJECT_ID = saved.projectId;
  else delete process.env.VERCEL_PROJECT_ID;
  if (saved.diag !== undefined) process.env.PHASE3M_ASSIGNMENT_DISPLAY_DIAG = saved.diag;
  else delete process.env.PHASE3M_ASSIGNMENT_DISPLAY_DIAG;
  if (saved.nodeEnv !== undefined) env["NODE_ENV"] = saved.nodeEnv;
  else delete env["NODE_ENV"];
}

function testGateMatrix() {
  const saved = saveEnv();
  setVerifiedStagingProjectIdForTests(STAGING_PROJECT);
  try {
    delete process.env.PHASE3M_ASSIGNMENT_DISPLAY_DIAG;
    env["NODE_ENV"] = "production";

    process.env.VERCEL_GIT_COMMIT_REF = "staging";
    process.env.VERCEL_PROJECT_ID = STAGING_PROJECT;
    assert.equal(
      isPhase3mAssignmentDisplayDiagnosticActive(),
      true,
      "staging project + staging branch",
    );

    process.env.VERCEL_PROJECT_ID = LIVE_PROJECT;
    assert.equal(
      isPhase3mAssignmentDisplayDiagnosticActive(),
      false,
      "live project + staging branch",
    );

    process.env.VERCEL_PROJECT_ID = STAGING_PROJECT;
    process.env.VERCEL_GIT_COMMIT_REF = "main";
    assert.equal(
      isPhase3mAssignmentDisplayDiagnosticActive(),
      false,
      "staging project + main branch",
    );

    process.env.VERCEL_GIT_COMMIT_REF = "staging";
    delete process.env.VERCEL_PROJECT_ID;
    assert.equal(
      isPhase3mAssignmentDisplayDiagnosticActive(),
      false,
      "missing runtime VERCEL_PROJECT_ID",
    );

    setVerifiedStagingProjectIdForTests("");
    process.env.VERCEL_PROJECT_ID = STAGING_PROJECT;
    process.env.VERCEL_GIT_COMMIT_REF = "staging";
    assert.equal(
      isPhase3mAssignmentDisplayDiagnosticActive(),
      false,
      "missing verified staging project id in config",
    );

    setVerifiedStagingProjectIdForTests(STAGING_PROJECT);
    delete process.env.VERCEL_GIT_COMMIT_REF;
    delete process.env.VERCEL_PROJECT_ID;
    env["NODE_ENV"] = "development";
    assert.equal(
      isPhase3mAssignmentDisplayDiagnosticActive(),
      false,
      "local without explicit opt-in",
    );

    process.env.PHASE3M_ASSIGNMENT_DISPLAY_DIAG = "1";
    assert.equal(
      isPhase3mAssignmentDisplayDiagnosticActive(),
      true,
      "local explicit opt-in (non-production)",
    );
  } finally {
    setVerifiedStagingProjectIdForTests(null);
    restoreEnv(saved);
  }
}

function testPayload() {
  const missing = buildPhase3mUserLookupDiagPayload("db", null);
  assert.equal(missing.lookupSucceeded, false);
  assert.equal(missing.nameNonEmpty, false);
  assert.equal(missing.displayNameNonEmpty, false);
  assert.equal(missing.publicLabelNonEmpty, false);
  assert.equal(missing.storageBackend, "db");

  const emptyNames = buildPhase3mUserLookupDiagPayload("json", {
    id: "x",
    name: "   ",
    email: "e@example.com",
    campusId: "c",
    passwordHash: "h",
    family: [],
    createdAt: "",
    updatedAt: "",
  });
  assert.equal(emptyNames.lookupSucceeded, true);
  assert.equal(emptyNames.nameNonEmpty, false);
  assert.equal(emptyNames.publicLabelNonEmpty, false);

  const ok = buildPhase3mUserLookupDiagPayload("db", {
    id: "x",
    name: "admin",
    displayName: "admin",
    email: "e@example.com",
    campusId: "c",
    passwordHash: "h",
    family: [],
    createdAt: "",
    updatedAt: "",
  });
  assert.equal(ok.lookupSucceeded, true);
  assert.equal(ok.nameNonEmpty, true);
  assert.equal(ok.displayNameNonEmpty, true);
  assert.equal(ok.publicLabelNonEmpty, true);

  const serialized = JSON.stringify(ok);
  assert.equal(serialized.includes("admin"), false);
  assert.equal(serialized.includes("1792541244421"), false);
  assert.equal(serialized.includes("@"), false);
}

function main() {
  testGateMatrix();
  testPayload();
  console.log("marriage-phase3m-assignment-display-diagnostic.test.ts: all passed");
}

main();
