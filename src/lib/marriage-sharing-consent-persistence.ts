import { isValidCounselorAnswerFingerprint } from "@/lib/marriage-counselor-consent";
import {
  clearCounselorDisclosureFields,
  rowHasCounselorDisclosureState,
} from "@/lib/marriage-sharing-consent-counselor-state";
import type {
  MarriagePartnerSharingConsentPatch,
  MarriageSharingConsentRecord,
} from "@/lib/marriage-counseling-types";

/** Merge partner patch onto existing row without clearing counselor metadata. */
export function mergePartnerSharingConsentPatch(
  existing: MarriageSharingConsentRecord | null,
  patch: MarriagePartnerSharingConsentPatch,
): MarriageSharingConsentRecord {
  if (!existing) {
    return {
      ...patch,
      counselorDisclosureGranted: false,
      consentedCounselorUserId: null,
      generationAtGrant: null,
      answerFingerprint: null,
      grantedAt: null,
    };
  }
  return {
    ...existing,
    granted: patch.granted,
    updatedAt: patch.updatedAt,
  };
}

/** Counselor revocation clears disclosure metadata; does not re-grant. */
export function buildCounselorConsentRevocationRecord(
  existing: MarriageSharingConsentRecord | null,
  key: Pick<
    MarriageSharingConsentRecord,
    "journeyId" | "moduleId" | "questionId" | "userId"
  >,
  updatedAt: string,
): MarriageSharingConsentRecord | null {
  if (!existing) return null;
  if (!rowHasCounselorDisclosureState(existing)) return null;
  return clearCounselorDisclosureFields(existing, updatedAt);
}

export function assertCounselorSharingConsentGrant(record: MarriageSharingConsentRecord): void {
  if (!record.counselorDisclosureGranted) return;
  if (record.generationAtGrant == null) {
    throw new Error("Counselor consent grant requires generationAtGrant.");
  }
  if (!record.consentedCounselorUserId?.trim()) {
    throw new Error("Counselor consent grant requires consentedCounselorUserId.");
  }
  if (!isValidCounselorAnswerFingerprint(record.answerFingerprint)) {
    throw new Error("Counselor consent grant requires a valid answerFingerprint.");
  }
}
