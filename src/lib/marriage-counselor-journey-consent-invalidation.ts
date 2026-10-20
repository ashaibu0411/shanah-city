import {
  clearCounselorDisclosureFields,
  rowHasCounselorDisclosureState,
} from "@/lib/marriage-sharing-consent-counselor-state";
import type { MarriageSharingConsentRecord } from "@/lib/marriage-counseling-types";
import type { MarriageDbTransaction } from "@/lib/marriage-concurrency-protocol";
import { mapSharingConsentRow } from "@/lib/marriage-counselor-consent-invalidation";

/** Revoke all counselor-disclosure permissions for a journey; preserve partner `granted`. */
export async function invalidateAllCounselorDisclosureForJourneyInTransaction(
  tx: MarriageDbTransaction,
  journeyId: string,
  revokedAt: string,
): Promise<void> {
  const rows = await tx.marriageSharingConsent.findMany({ where: { journeyId } });
  for (const row of rows) {
    const existing = mapSharingConsentRow(row);
    if (!rowHasCounselorDisclosureState(existing)) continue;
    const cleared = clearCounselorDisclosureFields(existing, revokedAt);
    await tx.marriageSharingConsent.update({
      where: {
        journeyId_moduleId_questionId_userId: {
          journeyId: cleared.journeyId,
          moduleId: cleared.moduleId,
          questionId: cleared.questionId,
          userId: cleared.userId,
        },
      },
      data: {
        counselorDisclosureGranted: false,
        consentedCounselorUserId: null,
        generationAtGrant: null,
        answerFingerprint: null,
        grantedAt: null,
        updatedAt: new Date(cleared.updatedAt),
      },
    });
  }
}

export function invalidateAllCounselorDisclosureForJourneyInMemory(
  consents: MarriageSharingConsentRecord[],
  journeyId: string,
  revokedAt: string,
): MarriageSharingConsentRecord[] {
  return consents.map((c) => {
    if (c.journeyId !== journeyId) return c;
    if (!rowHasCounselorDisclosureState(c)) return c;
    return clearCounselorDisclosureFields(c, revokedAt);
  });
}
