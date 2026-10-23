import type { PublicMember } from "@/lib/auth-types";
import { logMarriageAudit } from "@/lib/marriage-counseling-audit";
import { assertJourneyParticipantLoose } from "@/lib/marriage-counseling-access";
import { viewerIsJourneyParticipant } from "@/lib/marriage-counseling-participants";
import type {
  MarriageCounselorAssignmentRequestRecord,
  MarriageCounselorAssignmentRequestType,
} from "@/lib/marriage-counseling-types";
import {
  assertCanSubmitCounselorAssignmentRequest,
  assertSeniorPastor,
  isSeniorPastor,
} from "@/lib/marriage-counselor-assignment-authority";
import { assertAssignmentAdminOnJourney } from "@/lib/marriage-journey-administrative-coordinator-server";
import {
  requiredRestorationAcknowledgmentUserIds,
  restorationAcknowledgmentRequired,
} from "@/lib/marriage-counselor-assignment-restoration";
import { assertEligibleClinicalCounselor } from "@/lib/marriage-counselor-directory-server";
import { resolveAssignedCounselorDisplayName } from "@/lib/marriage-counselor-journey-names";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";
import { useDatabase } from "@/lib/use-database";

const store = () => marriageStore();

function newRequestId() {
  return `mcar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCounselorId(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function inferRequestType(
  previousCounselorUserId: string | null,
  requestedCounselorUserId: string | null,
): MarriageCounselorAssignmentRequestType {
  if (!requestedCounselorUserId) return "remove";
  if (!previousCounselorUserId) return "assign";
  return "reassign";
}

export async function submitCounselorAssignmentRequest(
  viewer: PublicMember,
  input: {
    journeyId: string;
    counselorUserId: string | null;
    requestType?: MarriageCounselorAssignmentRequestType;
  },
) {
  await assertCanSubmitCounselorAssignmentRequest(viewer);

  const journey = await store().getJourneyById(input.journeyId);
  if (!journey) throw new Error("Journey not found.");
  if (!(await isSeniorPastor(viewer))) {
    await assertAssignmentAdminOnJourney(viewer, input.journeyId);
  }

  const previousCounselorUserId = normalizeCounselorId(journey.counselorUserId);
  const requestedCounselorUserId = normalizeCounselorId(input.counselorUserId);
  const requestType =
    input.requestType ?? inferRequestType(previousCounselorUserId, requestedCounselorUserId);

  if (requestType === "remove") {
    if (!previousCounselorUserId) throw new Error("No counselor is assigned.");
  } else {
    if (!requestedCounselorUserId) throw new Error("Counselor is required.");
    await assertEligibleClinicalCounselor(requestedCounselorUserId);
    if (requestedCounselorUserId === viewer.id) {
      throw new Error("Counselors cannot assign themselves.");
    }
    if (
      requestType === "assign" &&
      previousCounselorUserId &&
      previousCounselorUserId !== requestedCounselorUserId
    ) {
      throw new Error("Use reassignment when a counselor is already assigned.");
    }
    if (requestType === "reassign" && previousCounselorUserId === requestedCounselorUserId) {
      throw new Error("This counselor is already assigned.");
    }
  }

  await store().supersedePendingCounselorAssignmentRequests(input.journeyId);

  const now = new Date().toISOString();
  const record: MarriageCounselorAssignmentRequestRecord = {
    id: newRequestId(),
    journeyId: input.journeyId,
    requestType,
    requestedCounselorUserId: requestType === "remove" ? null : requestedCounselorUserId,
    previousCounselorUserId,
    status: "pending",
    requestedByUserId: viewer.id,
    requestedAt: now,
  };
  await store().saveCounselorAssignmentRequest(record);

  await logMarriageAudit({
    actorUserId: viewer.id,
    action: "counselor_assignment_requested",
    journeyId: input.journeyId,
    targetUserId: record.requestedCounselorUserId ?? undefined,
    meta: {
      requestId: record.id,
      requestType: record.requestType,
      previousCounselorUserId: previousCounselorUserId ?? "",
    },
  });

  return { ok: true as const, request: record };
}

export async function approveCounselorAssignmentRequest(
  viewer: PublicMember,
  input: { requestId: string; decisionNote?: string; acknowledgeApproval?: boolean },
) {
  await assertSeniorPastor(viewer);

  const request = await store().getCounselorAssignmentRequestById(input.requestId);
  if (!request) throw new Error("Request not found.");
  if (request.status !== "pending") throw new Error("Request is not pending.");

  const requireExplicitSelfApproval =
    request.requestedByUserId === viewer.id && !input.acknowledgeApproval;
  if (requireExplicitSelfApproval) {
    throw new Error("Explicit approval confirmation required.");
  }

  const execution = useDatabase()
    ? await (
        await import("@/lib/stores/marriage-counseling-db")
      ).approveCounselorAssignmentRequestInTransaction({
        requestId: input.requestId,
        seniorPastorUserId: viewer.id,
        decisionNote: input.decisionNote?.trim() || null,
        requireExplicitSelfApproval,
      })
    : await (
        await import("@/lib/stores/marriage-counseling-json")
      ).approveCounselorAssignmentRequestAtomic({
        requestId: input.requestId,
        seniorPastorUserId: viewer.id,
        decisionNote: input.decisionNote?.trim() || null,
        requireExplicitSelfApproval,
      });

  const approved = await store().getCounselorAssignmentRequestById(input.requestId);
  if (!approved) throw new Error("Request not found.");

  await logMarriageAudit({
    actorUserId: viewer.id,
    action: "counselor_assignment_approved",
    journeyId: request.journeyId,
    targetUserId: request.requestedCounselorUserId ?? undefined,
    meta: {
      requestId: request.id,
      requesterUserId: request.requestedByUserId,
      requestType: request.requestType,
    },
  });

  if (execution.executed) {
    await logMarriageAudit({
      actorUserId: viewer.id,
      action: "counselor_assignment_activated",
      journeyId: request.journeyId,
      targetUserId: request.requestedCounselorUserId ?? undefined,
      meta: {
        requestId: request.id,
        requestType: request.requestType,
      },
    });
  }

  return { ok: true as const, request: approved, ...execution };
}

export async function rejectCounselorAssignmentRequest(
  viewer: PublicMember,
  input: { requestId: string; decisionNote?: string },
) {
  await assertSeniorPastor(viewer);

  const request = await store().getCounselorAssignmentRequestById(input.requestId);
  if (!request) throw new Error("Request not found.");
  if (request.status !== "pending") throw new Error("Request is not pending.");

  const now = new Date().toISOString();
  await store().saveCounselorAssignmentRequest({
    ...request,
    status: "rejected",
    reviewedByUserId: viewer.id,
    reviewedAt: now,
    decisionNote: input.decisionNote?.trim() || null,
  });

  await logMarriageAudit({
    actorUserId: viewer.id,
    action: "counselor_assignment_rejected",
    journeyId: request.journeyId,
    meta: {
      requestId: request.id,
      requesterUserId: request.requestedByUserId,
    },
  });

  return { ok: true as const };
}

export async function acknowledgeCounselorAssignmentRestoration(
  viewer: PublicMember,
  input: { requestId: string },
) {
  const request = await store().getCounselorAssignmentRequestById(input.requestId);
  if (!request) throw new Error("Request not found.");
  if (request.status !== "approved") {
    throw new Error("This assignment is not awaiting participant authorization.");
  }
  if (request.executedAt) throw new Error("This assignment is already active.");
  if (request.requestType === "remove") {
    throw new Error("Removal requests do not require acknowledgment.");
  }
  if (!request.requestedCounselorUserId) throw new Error("Invalid request.");

  const journey = await store().getJourneyById(request.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertJourneyParticipantLoose(journey, viewer.id);

  const revocations = await store().listParticipantCounselorRevocations(request.journeyId);
  if (!restorationAcknowledgmentRequired(revocations, journey)) {
    throw new Error("Restoration acknowledgment is not required for this journey.");
  }

  const required = requiredRestorationAcknowledgmentUserIds(revocations);
  if (!required.includes(viewer.id)) {
    throw new Error("You are not required to authorize this restoration.");
  }

  const execution = useDatabase()
    ? await (
        await import("@/lib/stores/marriage-counseling-db")
      ).acknowledgeCounselorAssignmentRestorationInTransaction({
        requestId: input.requestId,
        participantUserId: viewer.id,
        counselorUserId: request.requestedCounselorUserId,
      })
    : await (
        await import("@/lib/stores/marriage-counseling-json")
      ).acknowledgeCounselorAssignmentRestorationAtomic({
        requestId: input.requestId,
        participantUserId: viewer.id,
        counselorUserId: request.requestedCounselorUserId,
      });

  await logMarriageAudit({
    actorUserId: viewer.id,
    action: "counselor_assignment_acknowledged",
    journeyId: request.journeyId,
    targetUserId: request.requestedCounselorUserId,
    meta: { requestId: request.id },
  });

  if (execution.executed) {
    await logMarriageAudit({
      actorUserId: viewer.id,
      action: "counselor_assignment_activated",
      journeyId: request.journeyId,
      targetUserId: request.requestedCounselorUserId,
      meta: {
        requestId: request.id,
        requestType: request.requestType,
      },
    });
  }

  return { ok: true as const, ...execution };
}

export async function getCounselorAssignmentRequestStatus(
  viewer: PublicMember,
  journeyId: string,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");

  const canSubmit = await import("@/lib/marriage-counselor-assignment-authority").then((m) =>
    m.canSubmitCounselorAssignmentRequest(viewer),
  );
  const isSp = await isSeniorPastor(viewer);
  const isParticipant = await viewerIsJourneyParticipant(journey, viewer.id);

  if (canSubmit && !isSp && !isParticipant) {
    await assertAssignmentAdminOnJourney(viewer, journeyId);
  } else if (!canSubmit && !isSp && !isParticipant) {
    throw new Error("Not authorized.");
  }

  const pending = await store().getPendingCounselorAssignmentRequestForJourney(journeyId);
  const approved = await store().getApprovedCounselorAssignmentRequestAwaitingExecution(journeyId);
  const revocations = await store().listParticipantCounselorRevocations(journeyId);

  let acknowledgments: string[] = [];
  let requestedCounselorDisplayName: string | null = null;
  if (approved) {
    const acks = await store().listCounselorAssignmentAcknowledgmentsForRequest(approved.id);
    acknowledgments = acks.map((a) => a.userId);
    requestedCounselorDisplayName = await resolveAssignedCounselorDisplayName(
      approved.requestedCounselorUserId,
    );
  }

  return {
    journeyId,
    activeCounselorUserId: journey.counselorUserId,
    pendingRequest: canSubmit || isSp ? pending : null,
    approvedAwaitingExecution:
      isSp || isParticipant
        ? approved
          ? {
              ...approved,
              acknowledgmentsReceived: acknowledgments,
              restorationRequired: restorationAcknowledgmentRequired(revocations, journey),
              restorationRequiredFrom: requiredRestorationAcknowledgmentUserIds(revocations),
              requestedCounselorDisplayName,
            }
          : null
        : null,
    participantRevocations: isParticipant || isSp ? revocations : [],
    permissions: {
      canSubmitRequest: canSubmit,
      canApprove: isSp,
      canAcknowledgeRestoration: isParticipant,
    },
  };
}
