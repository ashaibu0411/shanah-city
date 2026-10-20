import type { Prisma } from "@prisma/client";

/**
 * Marriage Hub privacy — lock order for DB transactions.
 *
 * Always acquire in this order when multiple resources are touched:
 *
 * 1. **MarriageCounselingJourney** (`id`) — counselor assignment via `applyCounselorJourneyAccessChange`.
 * 2. **MarriageRevisionRequest** (`id`, `FOR UPDATE`) — revision resolve idempotency.
 * 3. **Assessment draft serialization** — advisory xact lock on `(journeyId, moduleId, userId)`.
 * 4. **MarriageAssessmentResponse** — read/upsert after advisory lock (same composite key).
 * 5. **MarriageAnswerChangeGeneration** — per `(journeyId, moduleId, questionId, userId)`.
 * 6. **MarriageSharingConsent** — per `(journeyId, moduleId, questionId, userId)`.
 *
 * Consent-grant APIs must: lock (1), hold (3) for the participant module, read (4–5),
 * then write (6) with generationAtGrant and answerFingerprint matching the locked answer.
 *
 * Reassignment must: lock (1), bulk-revoke counselor disclosure on (6) for journey, never transfer grants.
 */
export const MARRIAGE_HUB_LOCK_ORDER = [
  "MarriageCounselingJourney",
  "MarriageRevisionRequest",
  "assessment_draft_advisory",
  "MarriageAssessmentResponse",
  "MarriageAnswerChangeGeneration",
  "MarriageSharingConsent",
] as const;

export type MarriageDbTransaction = Prisma.TransactionClient;

function assessmentDraftLockKey(journeyId: string, moduleId: string, userId: string): string {
  return `${journeyId}\0${moduleId}\0${userId}`;
}

/** Serializes concurrent draft saves and revision reopen for one participant module. */
export async function acquireAssessmentDraftAdvisoryLock(
  tx: MarriageDbTransaction,
  journeyId: string,
  moduleId: string,
  userId: string,
): Promise<void> {
  const key = assessmentDraftLockKey(journeyId, moduleId, userId);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
}

/** Locks journey row for counselor assignment checks and consent grants. */
export async function lockCounselingJourneyRow(
  tx: MarriageDbTransaction,
  journeyId: string,
): Promise<void> {
  await tx.$queryRaw`
    SELECT "id" FROM "MarriageCounselingJourney"
    WHERE "id" = ${journeyId}
    FOR UPDATE
  `;
}

/** Locks a pending revision row for idempotent approve/deny. */
export async function lockRevisionRequestRow(
  tx: MarriageDbTransaction,
  revisionRequestId: string,
): Promise<void> {
  await tx.$queryRaw`
    SELECT "id" FROM "MarriageRevisionRequest"
    WHERE "id" = ${revisionRequestId}
    FOR UPDATE
  `;
}
