import type { CounselorJourneyAccessPatch } from "@/lib/marriage-counselor-assignment-change";
import type {
  MarriageCounselorAssignmentAcknowledgmentRecord,
  MarriageCounselorAssignmentRequestRecord,
  MarriageCounselorParticipantRevocationRecord,
} from "@/lib/marriage-counseling-types";
import {
  allRequiredRestorationAcknowledgmentsPresent,
  requiredRestorationAcknowledgmentUserIds,
} from "@/lib/marriage-counselor-assignment-restoration";

export function normalizeCounselorAssignmentId(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function validateJourneySnapshotMatchesRequest(
  request: Pick<MarriageCounselorAssignmentRequestRecord, "previousCounselorUserId">,
  currentCounselorUserId: string | null | undefined,
): void {
  const current = normalizeCounselorAssignmentId(currentCounselorUserId);
  const snapshot = normalizeCounselorAssignmentId(request.previousCounselorUserId);
  if (snapshot !== current) {
    throw new Error("Counselor assignment changed since this request was submitted.");
  }
}

export function buildExecutionPatchForRequest(
  request: Pick<
    MarriageCounselorAssignmentRequestRecord,
    "requestType" | "requestedCounselorUserId"
  >,
): CounselorJourneyAccessPatch {
  if (request.requestType === "remove") {
    return { counselorUserId: null, counselorAccessRevokedAt: null };
  }
  return {
    counselorUserId: request.requestedCounselorUserId,
    counselorAccessRevokedAt: null,
  };
}

export function restorationAcknowledgmentsSatisfied(
  request: Pick<MarriageCounselorAssignmentRequestRecord, "requestType" | "requestedCounselorUserId">,
  revocations: MarriageCounselorParticipantRevocationRecord[],
  acknowledgments: MarriageCounselorAssignmentAcknowledgmentRecord[],
): boolean {
  if (request.requestType === "remove") return true;
  if (revocations.length === 0) return true;
  const required = requiredRestorationAcknowledgmentUserIds(revocations);
  const counselorId = normalizeCounselorAssignmentId(request.requestedCounselorUserId);
  if (!counselorId) return false;
  for (const ack of acknowledgments) {
    if (normalizeCounselorAssignmentId(ack.counselorUserId) !== counselorId) {
      throw new Error("Acknowledgment does not match the approved counselor.");
    }
  }
  const ackUsers = acknowledgments.map((a) => a.userId);
  return allRequiredRestorationAcknowledgmentsPresent(required, ackUsers);
}

/** Throws if request cannot be executed (stale, wrong status, missing acks). */
export function assertApprovedRequestReadyToExecute(input: {
  request: MarriageCounselorAssignmentRequestRecord;
  currentCounselorUserId: string | null | undefined;
  revocations: MarriageCounselorParticipantRevocationRecord[];
  acknowledgments: MarriageCounselorAssignmentAcknowledgmentRecord[];
}): void {
  const { request } = input;
  if (request.status !== "approved") {
    throw new Error("Request is not approved for execution.");
  }
  if (request.executedAt) {
    throw new Error("Request was already executed.");
  }
  validateJourneySnapshotMatchesRequest(request, input.currentCounselorUserId);
  if (
    !restorationAcknowledgmentsSatisfied(request, input.revocations, input.acknowledgments)
  ) {
    throw new Error("Restoration acknowledgments are incomplete.");
  }
}

/** Returns false when approved but waiting on participant acknowledgments (not an error). */
export function canExecuteApprovedRequestNow(input: {
  request: MarriageCounselorAssignmentRequestRecord;
  currentCounselorUserId: string | null | undefined;
  revocations: MarriageCounselorParticipantRevocationRecord[];
  acknowledgments: MarriageCounselorAssignmentAcknowledgmentRecord[];
}): boolean {
  if (input.request.status !== "approved" || input.request.executedAt) return false;
  try {
    validateJourneySnapshotMatchesRequest(input.request, input.currentCounselorUserId);
  } catch {
    return false;
  }
  return restorationAcknowledgmentsSatisfied(
    input.request,
    input.revocations,
    input.acknowledgments,
  );
}
