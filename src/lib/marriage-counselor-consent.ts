import { createHash } from "node:crypto";
import {
  counselorConsentBoundToAssignedCounselor,
  counselorConsentGenerationValid,
  hasCompleteCounselorConsentMetadata,
  isAnswerDisclosableToCounselor,
  isValidCounselorAnswerFingerprint,
  normalizeAnswerForFingerprint,
  viewerIsAssignedCounselor,
  type CounselorDisclosureCheckInput,
  type CounselorDisclosureCheckResult,
} from "@/lib/marriage-counselor-consent-shared";
import { isCounselorDisclosureGranted } from "@/lib/marriage-sharing-consent-counselor-state";

export {
  answerValuesEqual,
  consentKeyMatches,
  counselorConsentBoundToAssignedCounselor,
  counselorConsentGenerationValid,
  COUNSELOR_CONSENT_ANSWER_CHANGED_MESSAGE,
  formatSavedAnswerForParticipantConsent,
  hasCompleteCounselorConsentMetadata,
  isAnswerDisclosableToCounselor,
  isValidCounselorAnswerFingerprint,
  normalizeAnswerForFingerprint,
  shouldIncrementGenerationForAnswerChange,
  viewerIsAssignedCounselor,
  type CounselorDisclosureCheckInput,
  type CounselorDisclosureCheckResult,
  type CounselorDisclosureDenialReason,
} from "@/lib/marriage-counselor-consent-shared";

export function computeAnswerFingerprint(value: unknown): string {
  const normalized = normalizeAnswerForFingerprint(value);
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

/**
 * Default-deny counselor answer disclosure. Does not expose answer content.
 * Fingerprint mismatch denies even if text matches a prior grant (edit-and-revert).
 */
export function verifyCounselorAnswerDisclosure(
  input: CounselorDisclosureCheckInput,
): CounselorDisclosureCheckResult {
  const { consent, currentGeneration, assignedCounselorUserId, viewerCounselorUserId, currentAnswer } =
    input;

  if (!isCounselorDisclosureGranted(consent)) {
    return { allowed: false, reason: "consent_not_granted" };
  }
  if (!hasCompleteCounselorConsentMetadata(consent)) {
    return { allowed: false, reason: "counselor_metadata_incomplete" };
  }
  if (!viewerIsAssignedCounselor(viewerCounselorUserId, assignedCounselorUserId)) {
    return { allowed: false, reason: "viewer_not_assigned_counselor" };
  }
  if (!counselorConsentBoundToAssignedCounselor(consent, assignedCounselorUserId)) {
    return { allowed: false, reason: "counselor_assignment_mismatch" };
  }
  if (!counselorConsentGenerationValid(consent, currentGeneration)) {
    return { allowed: false, reason: "generation_mismatch" };
  }
  if (!isAnswerDisclosableToCounselor(currentAnswer)) {
    return { allowed: false, reason: "answer_not_disclosable" };
  }
  if (!isValidCounselorAnswerFingerprint(consent.answerFingerprint)) {
    return { allowed: false, reason: "fingerprint_missing" };
  }
  const current = computeAnswerFingerprint(currentAnswer);
  if (current !== consent.answerFingerprint!.trim()) {
    return { allowed: false, reason: "fingerprint_mismatch" };
  }
  return { allowed: true };
}
