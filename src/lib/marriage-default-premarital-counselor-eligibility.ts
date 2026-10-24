import { MARRIAGE_CONSENT_VERSION } from "@/lib/marriage-counseling-curriculum";

export type DefaultPremaritalQueueEvaluationInput = {
  programType: string;
  activeCounselorUserId: string | null;
  configuredCounselorUserId: string | null;
  automationRequestedByUserId: string | null;
  participantAId: string | null;
  participantBId: string | null;
  consentedUserIds: string[];
  hasPendingAssignmentRequest: boolean;
  hasApprovedAssignmentAwaitingExecution: boolean;
};

export function bothPartnersConsentedUserIds(
  participantAId: string | null,
  participantBId: string | null,
  consentedUserIds: string[],
  consentVersion: string = MARRIAGE_CONSENT_VERSION,
): boolean {
  if (!participantAId?.trim() || !participantBId?.trim()) return false;
  const required = [participantAId.trim(), participantBId.trim()];
  const consented = new Set(consentedUserIds.map((id) => id.trim()));
  return required.every((id) => consented.has(id));
}

/** Pure gate for whether an automated default assignment request may be created. */
export function shouldQueueDefaultPremaritalCounselorAssignment(
  input: DefaultPremaritalQueueEvaluationInput,
): boolean {
  if (input.programType !== "premarital") return false;
  if (input.activeCounselorUserId?.trim()) return false;
  if (input.hasPendingAssignmentRequest || input.hasApprovedAssignmentAwaitingExecution) {
    return false;
  }
  const counselorId = input.configuredCounselorUserId?.trim();
  const requesterId = input.automationRequestedByUserId?.trim();
  if (!counselorId || !requesterId) return false;
  if (counselorId === requesterId) return false;
  if (
    !bothPartnersConsentedUserIds(
      input.participantAId,
      input.participantBId,
      input.consentedUserIds,
    )
  ) {
    return false;
  }
  return true;
}
