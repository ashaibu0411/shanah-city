/**
 * Phase 3M Step 2 — UI permission and copy helpers (no browser).
 * Run: npx.cmd tsx scripts/marriage-phase3m-assignment-ui.test.ts
 */
import assert from "node:assert/strict";
import {
  counselorAssignmentHistoryStatusLabel,
  counselorAssignmentUiCapabilities,
  counselorAssignmentWorkflowStatusLabel,
  marriageHubShowsCounselorAssignmentsNav,
} from "../src/lib/marriage-counselor-assignment-ui";

function testAdminNeverSeesApproveActions() {
  const caps = counselorAssignmentUiCapabilities({
    canSubmitRequest: true,
    canApprove: false,
    canAcknowledgeRestoration: false,
  });
  assert.equal(caps.showApproveActions, false);
  assert.equal(caps.showSubmitActions, true);
  assert.equal(caps.showCoordinatorManagement, false);
}

function testSeniorPastorSeesApprovalDashboardNotAdminSubmit() {
  const caps = counselorAssignmentUiCapabilities({
    canSubmitRequest: false,
    canApprove: true,
    canAcknowledgeRestoration: false,
  });
  assert.equal(caps.showApprovalDashboard, true);
  assert.equal(caps.showSubmitActions, false);
  assert.equal(caps.showApproveActions, true);
  assert.equal(caps.showCoordinatorManagement, true);
}

function testParticipantRestorationFlag() {
  const caps = counselorAssignmentUiCapabilities({
    canSubmitRequest: false,
    canApprove: false,
    canAcknowledgeRestoration: true,
  });
  assert.equal(caps.showParticipantRestoration, true);
  assert.equal(caps.showApproveActions, false);
}

function testPendingStatusCopy() {
  const label = counselorAssignmentWorkflowStatusLabel({
    pendingRequest: { status: "pending" },
    approvedAwaitingExecution: null,
    activeCounselorUserId: "c-1",
  });
  assert.match(label, /Senior Pastor approval/i);
}

function testHistoryExecutedLabel() {
  assert.equal(
    counselorAssignmentHistoryStatusLabel("executed", "2026-01-01T00:00:00.000Z"),
    "Completed",
  );
}

function testHubCounselorAssignmentsNavVisibility() {
  assert.equal(
    marriageHubShowsCounselorAssignmentsNav({
      canSubmitCounselorAssignment: false,
      isSeniorPastorCounselorApprover: false,
    }),
    false,
  );
  assert.equal(
    marriageHubShowsCounselorAssignmentsNav({
      canSubmitCounselorAssignment: true,
      isSeniorPastorCounselorApprover: false,
    }),
    true,
  );
  assert.equal(
    marriageHubShowsCounselorAssignmentsNav({
      canSubmitCounselorAssignment: false,
      isSeniorPastorCounselorApprover: true,
    }),
    true,
  );
}

async function main() {
  testAdminNeverSeesApproveActions();
  testSeniorPastorSeesApprovalDashboardNotAdminSubmit();
  testParticipantRestorationFlag();
  testPendingStatusCopy();
  testHistoryExecutedLabel();
  testHubCounselorAssignmentsNavVisibility();
  console.log("marriage-phase3m-assignment-ui.test.ts: all passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
