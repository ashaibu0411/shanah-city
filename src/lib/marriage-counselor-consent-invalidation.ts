import { buildCounselorConsentRevocationRecord } from "@/lib/marriage-sharing-consent-persistence";
import type { MarriageSharingConsentRecord } from "@/lib/marriage-counseling-types";
import type { MarriageDbTransaction } from "@/lib/marriage-concurrency-protocol";

export function mapSharingConsentRow(r: {
  journeyId: string;
  moduleId: string;
  questionId: string;
  userId: string;
  granted: boolean;
  updatedAt: Date;
  counselorDisclosureGranted?: boolean;
  consentedCounselorUserId: string | null;
  generationAtGrant: number | null;
  answerFingerprint: string | null;
  grantedAt: Date | null;
}): MarriageSharingConsentRecord {
  return {
    journeyId: r.journeyId,
    moduleId: r.moduleId,
    questionId: r.questionId,
    userId: r.userId,
    granted: r.granted,
    updatedAt: r.updatedAt.toISOString(),
    counselorDisclosureGranted: r.counselorDisclosureGranted === true,
    consentedCounselorUserId: r.consentedCounselorUserId,
    generationAtGrant: r.generationAtGrant,
    answerFingerprint: r.answerFingerprint,
    grantedAt: r.grantedAt?.toISOString() ?? null,
  };
}

/** Increment generation and revoke counselor disclosure metadata per question (same transaction). */
export async function invalidateCounselorQuestionsInTransaction(
  tx: MarriageDbTransaction,
  params: {
    journeyId: string;
    moduleId: string;
    userId: string;
    questionIds: string[];
    revokedAt: string;
  },
): Promise<void> {
  const { journeyId, moduleId, userId, questionIds, revokedAt } = params;
  for (const questionId of questionIds) {
    await tx.marriageAnswerChangeGeneration.upsert({
      where: {
        journeyId_moduleId_questionId_userId: { journeyId, moduleId, questionId, userId },
      },
      create: {
        journeyId,
        moduleId,
        questionId,
        userId,
        generation: 1,
      },
      update: {
        generation: { increment: 1 },
      },
    });

    const existingRow = await tx.marriageSharingConsent.findUnique({
      where: {
        journeyId_moduleId_questionId_userId: { journeyId, moduleId, questionId, userId },
      },
    });
    const existing = existingRow ? mapSharingConsentRow(existingRow) : null;
    const revocation = buildCounselorConsentRevocationRecord(
      existing,
      { journeyId, moduleId, questionId, userId },
      revokedAt,
    );
    if (!revocation) continue;

    await tx.marriageSharingConsent.upsert({
      where: {
        journeyId_moduleId_questionId_userId: { journeyId, moduleId, questionId, userId },
      },
      create: {
        journeyId: revocation.journeyId,
        moduleId: revocation.moduleId,
        questionId: revocation.questionId,
        userId: revocation.userId,
        granted: revocation.granted,
        counselorDisclosureGranted: false,
        updatedAt: new Date(revocation.updatedAt),
        consentedCounselorUserId: null,
        generationAtGrant: null,
        answerFingerprint: null,
        grantedAt: null,
      },
      update: {
        counselorDisclosureGranted: false,
        updatedAt: new Date(revocation.updatedAt),
        consentedCounselorUserId: null,
        generationAtGrant: null,
        answerFingerprint: null,
        grantedAt: null,
      },
    });
  }
}
