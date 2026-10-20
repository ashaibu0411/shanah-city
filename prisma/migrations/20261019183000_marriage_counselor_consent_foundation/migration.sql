-- Marriage Hub Phase 1: counselor consent metadata + per-question answer change generation (additive).

ALTER TABLE "MarriageSharingConsent" ADD COLUMN "consentedCounselorUserId" TEXT;
ALTER TABLE "MarriageSharingConsent" ADD COLUMN "generationAtGrant" INTEGER;
ALTER TABLE "MarriageSharingConsent" ADD COLUMN "answerFingerprint" TEXT;
ALTER TABLE "MarriageSharingConsent" ADD COLUMN "grantedAt" TIMESTAMP(3);

CREATE TABLE "MarriageAnswerChangeGeneration" (
    "journeyId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "generation" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MarriageAnswerChangeGeneration_pkey" PRIMARY KEY ("journeyId","moduleId","questionId","userId")
);
