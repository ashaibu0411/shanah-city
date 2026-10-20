import type { MarriageSharingConsentRecord } from "@/lib/marriage-counseling-types";

/** Partner comparison uses `granted`; counselor disclosure uses `counselorDisclosureGranted`. */
export function isCounselorDisclosureGranted(consent: MarriageSharingConsentRecord): boolean {
  return consent.counselorDisclosureGranted === true;
}

export function rowHasCounselorDisclosureState(consent: MarriageSharingConsentRecord): boolean {
  if (consent.counselorDisclosureGranted === true) return true;
  return (
    consent.generationAtGrant != null ||
    Boolean(consent.consentedCounselorUserId?.trim()) ||
    Boolean(consent.answerFingerprint?.trim()) ||
    Boolean(consent.grantedAt?.trim())
  );
}

/** Clears counselor disclosure fields; preserves partner `granted`. */
export function clearCounselorDisclosureFields(
  existing: MarriageSharingConsentRecord,
  updatedAt: string,
): MarriageSharingConsentRecord {
  return {
    ...existing,
    updatedAt,
    counselorDisclosureGranted: false,
    consentedCounselorUserId: null,
    generationAtGrant: null,
    answerFingerprint: null,
    grantedAt: null,
  };
}
