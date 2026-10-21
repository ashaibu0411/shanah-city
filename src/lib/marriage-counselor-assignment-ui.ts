import type { MarriageCounselorAssignmentRequestRecord } from "@/lib/marriage-counseling-types";

export type CounselorAssignmentUiPermissions = {
  canSubmitRequest: boolean;
  canApprove: boolean;
  canAcknowledgeRestoration: boolean;
};

/** Hub /marriage nav — mirrors getCounselorAssignmentUiCapabilities().canAccessAdminPage. */
export function marriageHubShowsCounselorAssignmentsNav(input: {
  canSubmitCounselorAssignment: boolean;
  isSeniorPastorCounselorApprover: boolean;
}): boolean {
  return input.canSubmitCounselorAssignment || input.isSeniorPastorCounselorApprover;
}

/** UI must mirror server permissions — never treat missing buttons as authorization. */
export function counselorAssignmentUiCapabilities(
  permissions: CounselorAssignmentUiPermissions,
): {
  showAdminWorkspace: boolean;
  showApprovalDashboard: boolean;
  showCoordinatorManagement: boolean;
  showParticipantRestoration: boolean;
  showApproveActions: boolean;
  showSubmitActions: boolean;
} {
  return {
    showAdminWorkspace: permissions.canSubmitRequest,
    showApprovalDashboard: permissions.canApprove,
    showCoordinatorManagement: permissions.canApprove,
    showParticipantRestoration: permissions.canAcknowledgeRestoration,
    showApproveActions: permissions.canApprove,
    showSubmitActions: permissions.canSubmitRequest && !permissions.canApprove,
  };
}

export type AdministrativeCoordinatorRosterRow = {
  journeyId: string;
  coupleNames: string;
  programType: string;
  coordinatorUserId: string | null;
  coordinatorName: string | null;
  assignedAt: string | null;
  assignedByUserId: string | null;
  assignedByName: string | null;
};

export type CoordinatorRosterFilter = "all" | "assigned" | "unassigned";

export function filterAdministrativeCoordinatorRoster(
  rows: AdministrativeCoordinatorRosterRow[],
  input: { search: string; assignment: CoordinatorRosterFilter },
): AdministrativeCoordinatorRosterRow[] {
  const q = input.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (input.assignment === "assigned" && !row.coordinatorUserId) return false;
    if (input.assignment === "unassigned" && row.coordinatorUserId) return false;
    if (!q) return true;
    const haystack = [
      row.coupleNames,
      row.coordinatorName ?? "",
      row.programType,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function counselorAssignmentRequestTypeLabel(
  type: MarriageCounselorAssignmentRequestRecord["requestType"],
): string {
  if (type === "assign") return "New assignment";
  if (type === "reassign") return "Reassignment";
  return "Remove counselor";
}

export function counselorAssignmentWorkflowStatusLabel(input: {
  pendingRequest: Pick<MarriageCounselorAssignmentRequestRecord, "status"> | null;
  approvedAwaitingExecution: { restorationRequired: boolean; executedAt?: string | null } | null;
  activeCounselorUserId: string | null;
}): string {
  if (input.pendingRequest?.status === "pending") {
    return "Awaiting Senior Pastor approval";
  }
  if (input.approvedAwaitingExecution) {
    if (input.approvedAwaitingExecution.restorationRequired) {
      return "Approved — awaiting participant acknowledgment";
    }
    return "Approved — awaiting activation";
  }
  if (input.activeCounselorUserId) {
    return "Counselor assigned";
  }
  return "No counselor assigned";
}

export function counselorAssignmentHistoryStatusLabel(
  status: MarriageCounselorAssignmentRequestRecord["status"],
  executedAt: string | null | undefined,
): string {
  if (status === "pending") return "Awaiting Senior Pastor approval";
  if (status === "rejected") return "Rejected";
  if (status === "cancelled") return "Cancelled";
  if (status === "superseded") return "Superseded";
  if (status === "executed" || executedAt) return "Completed";
  if (status === "approved") return "Approved";
  return status;
}
