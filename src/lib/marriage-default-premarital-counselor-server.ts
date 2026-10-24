import { getUserById } from "@/lib/auth-server";
import type { PublicMember } from "@/lib/auth-types";
import { MARRIAGE_CONSENT_VERSION } from "@/lib/marriage-counseling-curriculum";
import type {
  MarriageHubCounselorSummary,
  MarriagePrepDefaultCounselorSettingRecord,
} from "@/lib/marriage-counseling-types";
import {
  assertCanSubmitCounselorAssignmentRequest,
  canSubmitCounselorAssignmentRequest,
} from "@/lib/marriage-counselor-assignment-authority";
import { assignmentAdminIdsFromEnv } from "@/lib/marriage-journey-administrative-coordinator-policy";
import { createPendingCounselorAssignmentRequest } from "@/lib/marriage-counselor-assignment-request-server";
import { assertEligibleClinicalCounselor } from "@/lib/marriage-counselor-directory-server";
import { resolveAssignedCounselorDisplayName } from "@/lib/marriage-counselor-journey-names";
import { restorationAcknowledgmentRequired } from "@/lib/marriage-counselor-assignment-restoration";
import { shouldQueueDefaultPremaritalCounselorAssignment } from "@/lib/marriage-default-premarital-counselor-eligibility";
import { notifyMarriageDefaultCounselorAssignmentQueued } from "@/lib/marriage-counseling-notify";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

export async function getDefaultPremaritalCounselorSettingForAdmin(): Promise<{
  setting: MarriagePrepDefaultCounselorSettingRecord | null;
  counselorDisplayName: string | null;
}> {
  const setting = await store().getMarriagePrepDefaultCounselorSetting();
  if (!setting?.counselorUserId) {
    return { setting, counselorDisplayName: null };
  }
  return {
    setting,
    counselorDisplayName: await resolveAssignedCounselorDisplayName(setting.counselorUserId),
  };
}

export async function updateDefaultPremaritalCounselorSetting(
  viewer: PublicMember,
  input: { counselorUserId: string | null },
) {
  await assertCanSubmitCounselorAssignmentRequest(viewer);

  const counselorUserId = input.counselorUserId?.trim() || null;
  let automationRequestedByUserId: string | null = null;
  if (counselorUserId) {
    await assertEligibleClinicalCounselor(counselorUserId);
    const user = await getUserById(counselorUserId);
    if (!user) throw new Error("Counselor user account not found.");
    automationRequestedByUserId =
      viewer.id !== counselorUserId
        ? viewer.id
        : [...assignmentAdminIdsFromEnv()].find((id) => id !== counselorUserId) ?? null;
    if (!automationRequestedByUserId) {
      throw new Error(
        "Configure MARRIAGE_COUNSELOR_ASSIGNMENT_ADMIN_USER_IDS with an admin who is not the default counselor, or have another assignment admin save this setting.",
      );
    }
  }

  const now = new Date().toISOString();
  const record: MarriagePrepDefaultCounselorSettingRecord = {
    counselorUserId,
    automationRequestedByUserId,
    updatedByUserId: viewer.id,
    updatedAt: now,
  };
  await store().saveMarriagePrepDefaultCounselorSetting(record);
  return { ok: true as const, setting: record };
}

export async function queueDefaultPremaritalCounselorAssignmentIfEligible(
  journeyId: string,
): Promise<{ queued: boolean; requestId?: string }> {
  const setting = await store().getMarriagePrepDefaultCounselorSetting();
  const journey = await store().getJourneyById(journeyId);
  if (!journey) return { queued: false };

  const consents = await store().getConsentsForJourney(journeyId);
  const consentedUserIds = consents
    .filter((c) => c.consentVersion === MARRIAGE_CONSENT_VERSION)
    .map((c) => c.userId);

  const pending = await store().getPendingCounselorAssignmentRequestForJourney(journeyId);
  const approved = await store().getApprovedCounselorAssignmentRequestAwaitingExecution(journeyId);

  const eligible = shouldQueueDefaultPremaritalCounselorAssignment({
    programType: journey.programType,
    activeCounselorUserId: journey.counselorUserId,
    configuredCounselorUserId: setting?.counselorUserId ?? null,
    automationRequestedByUserId: setting?.automationRequestedByUserId ?? null,
    participantAId: journey.participantAId ?? null,
    participantBId: journey.participantBId ?? null,
    consentedUserIds,
    hasPendingAssignmentRequest: Boolean(pending),
    hasApprovedAssignmentAwaitingExecution: Boolean(approved),
  });

  if (!eligible || !setting?.counselorUserId || !setting.automationRequestedByUserId) {
    return { queued: false };
  }

  await assertEligibleClinicalCounselor(setting.counselorUserId);

  const { request } = await createPendingCounselorAssignmentRequest({
    journeyId,
    requestedCounselorUserId: setting.counselorUserId,
    requestedByUserId: setting.automationRequestedByUserId,
    requestType: "assign",
    auditMeta: { source: "default_premarital_automation" },
  });

  notifyMarriageDefaultCounselorAssignmentQueued(setting.counselorUserId);

  return { queued: true, requestId: request.id };
}

export async function buildMarriageHubCounselorSummary(
  journeyId: string,
): Promise<MarriageHubCounselorSummary | null> {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) return null;

  if (journey.counselorUserId?.trim()) {
    return {
      status: "assigned",
      displayName: await resolveAssignedCounselorDisplayName(journey.counselorUserId),
    };
  }

  const approved = await store().getApprovedCounselorAssignmentRequestAwaitingExecution(journeyId);
  if (approved) {
    const revocations = await store().listParticipantCounselorRevocations(journeyId);
    const restorationRequired = restorationAcknowledgmentRequired(revocations, journey);
    return {
      status: restorationRequired ? "awaiting_restoration" : "pending_approval",
      displayName: await resolveAssignedCounselorDisplayName(approved.requestedCounselorUserId),
    };
  }

  const pending = await store().getPendingCounselorAssignmentRequestForJourney(journeyId);
  if (pending?.requestedCounselorUserId) {
    return {
      status: "pending_approval",
      displayName: await resolveAssignedCounselorDisplayName(pending.requestedCounselorUserId),
    };
  }

  return { status: "none", displayName: null };
}

export async function assertCanManageDefaultPremaritalCounselorSetting(
  viewer: PublicMember,
): Promise<void> {
  if (!(await canSubmitCounselorAssignmentRequest(viewer))) {
    throw new Error("Not authorized to manage default premarital counselor settings.");
  }
}
