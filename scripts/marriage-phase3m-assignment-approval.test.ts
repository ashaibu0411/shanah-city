/**
 * Phase 3M Step 1 — counselor assignment approval + restoration acknowledgment.
 * Run: npx.cmd tsx scripts/marriage-phase3m-assignment-approval.test.ts
 */
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PublicMember } from "../src/lib/auth-types";
import {
  approveCounselorAssignmentRequest,
  acknowledgeCounselorAssignmentRestoration,
  submitCounselorAssignmentRequest,
} from "../src/lib/marriage-counselor-assignment-request-server";
import { revokeCounselorAccess } from "../src/lib/marriage-counseling-privacy-server";
import { assignAdministrativeCoordinator } from "../src/lib/marriage-journey-administrative-coordinator-server";

function member(id: string): PublicMember {
  return { id, name: id, email: `${id}@test.local`, role: "member" } as PublicMember;
}

function setupEnv(root: string) {
  const dataDir = join(root, "data");
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(
    join(dataDir, "pastoral-roles.json"),
    JSON.stringify({ seniorPastorUserId: "sp-1", associatePastorUserId: null }),
  );
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dataDir, "marriage-counseling.json");
  delete process.env.DATABASE_URL;
  delete process.env.MARRIAGE_E2E_ISOLATED;
  process.env.MARRIAGE_COUNSELOR_USER_IDS = "c-target,c-old";
  process.env.MARRIAGE_COUNSELOR_ASSIGNMENT_ADMIN_USER_IDS = "admin-1";
}

async function assignAdminCoordinator(journeyId: string) {
  await assignAdministrativeCoordinator(member("sp-1"), {
    journeyId,
    coordinatorUserId: "admin-1",
  });
}

async function createJourneyWithCounselor(counselorId: string) {
  const jsonStore = await import("../src/lib/stores/marriage-counseling-json");
  return jsonStore.createJourney({
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: null,
    counselorUserId: counselorId,
    createdBy: "u-a",
    participantAId: "u-a",
    participantBId: "u-b",
  });
}

async function testPendingDoesNotActivateCounselor() {
  const root = mkdtempSync(join(tmpdir(), "mcar-pending-"));
  const prev = process.cwd();
  process.chdir(root);
  setupEnv(root);
  try {
    const journey = await createJourneyWithCounselor("c-old");
    await assignAdminCoordinator(journey.id);
    await submitCounselorAssignmentRequest(member("admin-1"), {
      journeyId: journey.id,
      counselorUserId: "c-target",
      requestType: "reassign",
    });
    const jsonStore = await import("../src/lib/stores/marriage-counseling-json");
    const j = await jsonStore.getJourneyById(journey.id);
    assert.equal(j?.counselorUserId, "c-old");
  } finally {
    process.chdir(prev);
    rmSync(root, { recursive: true, force: true });
    delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
  }
}

async function testAdminCannotApprove() {
  const root = mkdtempSync(join(tmpdir(), "mcar-admin-"));
  const prev = process.cwd();
  process.chdir(root);
  setupEnv(root);
  try {
    const journey = await createJourneyWithCounselor("c-old");
    await assignAdminCoordinator(journey.id);
    const { request } = await submitCounselorAssignmentRequest(member("admin-1"), {
      journeyId: journey.id,
      counselorUserId: "c-target",
      requestType: "reassign",
    });
    await assert.rejects(
      () => approveCounselorAssignmentRequest(member("admin-1"), { requestId: request.id }),
      /Senior Pastor approval required/,
    );
  } finally {
    process.chdir(prev);
    rmSync(root, { recursive: true, force: true });
    delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
  }
}

async function testRestorationRequiresParticipantAck() {
  const root = mkdtempSync(join(tmpdir(), "mcar-ack-"));
  const prev = process.cwd();
  process.chdir(root);
  setupEnv(root);
  try {
    const journey = await createJourneyWithCounselor("c-old");
    await revokeCounselorAccess(member("u-a"), journey.id);

    await assignAdminCoordinator(journey.id);
    const { request } = await submitCounselorAssignmentRequest(member("admin-1"), {
      journeyId: journey.id,
      counselorUserId: "c-target",
      requestType: "assign",
    });

    const approved = await approveCounselorAssignmentRequest(member("sp-1"), {
      requestId: request.id,
    });
    assert.equal(approved.executed, false);

    const jsonStore = await import("../src/lib/stores/marriage-counseling-json");
    let j = await jsonStore.getJourneyById(journey.id);
    assert.equal(j?.counselorUserId, null);

    await acknowledgeCounselorAssignmentRestoration(member("u-a"), { requestId: request.id });

    j = await jsonStore.getJourneyById(journey.id);
    assert.equal(j?.counselorUserId, "c-target");
  } finally {
    process.chdir(prev);
    rmSync(root, { recursive: true, force: true });
    delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
  }
}

async function testBothParticipantsMustAckWhenBothRevoked() {
  const root = mkdtempSync(join(tmpdir(), "mcar-both-"));
  const prev = process.cwd();
  process.chdir(root);
  setupEnv(root);
  try {
    const journey = await createJourneyWithCounselor("c-old");
    await revokeCounselorAccess(member("u-a"), journey.id);
    await revokeCounselorAccess(member("u-b"), journey.id);

    await assignAdminCoordinator(journey.id);
    const { request } = await submitCounselorAssignmentRequest(member("admin-1"), {
      journeyId: journey.id,
      counselorUserId: "c-target",
      requestType: "assign",
    });
    await approveCounselorAssignmentRequest(member("sp-1"), { requestId: request.id });

    await acknowledgeCounselorAssignmentRestoration(member("u-a"), { requestId: request.id });
    const jsonStore = await import("../src/lib/stores/marriage-counseling-json");
    let j = await jsonStore.getJourneyById(journey.id);
    assert.equal(j?.counselorUserId, null);

    await acknowledgeCounselorAssignmentRestoration(member("u-b"), { requestId: request.id });
    j = await jsonStore.getJourneyById(journey.id);
    assert.equal(j?.counselorUserId, "c-target");
  } finally {
    process.chdir(prev);
    rmSync(root, { recursive: true, force: true });
    delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
  }
}

async function testSelfAssignBlocked() {
  const root = mkdtempSync(join(tmpdir(), "mcar-self-"));
  const prev = process.cwd();
  process.chdir(root);
  setupEnv(root);
  try {
    const jsonStore = await import("../src/lib/stores/marriage-counseling-json");
    const journey = await jsonStore.createJourney({
      coupleLinkId: "",
      programType: "premarital",
      status: "active",
      currentModuleId: null,
      counselorUserId: null,
      createdBy: "u-a",
      participantAId: "u-a",
      participantBId: "u-b",
    });
    await assert.rejects(
      () =>
        submitCounselorAssignmentRequest(member("sp-1"), {
          journeyId: journey.id,
          counselorUserId: "sp-1",
          requestType: "assign",
        }),
      /cannot assign themselves/i,
    );
  } finally {
    process.chdir(prev);
    rmSync(root, { recursive: true, force: true });
    delete process.env.MARRIAGE_COUNSELING_DATA_FILE;
  }
}

async function main() {
  await testPendingDoesNotActivateCounselor();
  await testAdminCannotApprove();
  await testRestorationRequiresParticipantAck();
  await testBothParticipantsMustAckWhenBothRevoked();
  await testSelfAssignBlocked();
  console.log("marriage-phase3m-assignment-approval.test.ts: all passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
