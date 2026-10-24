-- Extend counseling sessions for premarital appointments
ALTER TABLE "MarriageCounselingSession" ADD COLUMN "schedulingTimeZone" TEXT;
ALTER TABLE "MarriageCounselingSession" ADD COLUMN "scheduledEndAt" TIMESTAMP(3);
ALTER TABLE "MarriageCounselingSession" ADD COLUMN "premaritalSessionKey" TEXT;
ALTER TABLE "MarriageCounselingSession" ADD COLUMN "meetingMode" TEXT;
ALTER TABLE "MarriageCounselingSession" ADD COLUMN "locationOrLink" TEXT;
ALTER TABLE "MarriageCounselingSession" ADD COLUMN "cancelReason" TEXT;

CREATE INDEX "MarriageCounselingSession_journeyId_premaritalSessionKey_idx"
  ON "MarriageCounselingSession"("journeyId", "premaritalSessionKey");

-- CreateTable
CREATE TABLE "MarriagePremaritalSessionClinical" (
    "journeyId" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3),
    "partnerAAttended" BOOLEAN,
    "partnerBAttended" BOOLEAN,
    "outcome" TEXT,
    "topicsCovered" TEXT,
    "followUpActions" TEXT,
    "privateObservations" TEXT,
    "linkedAppointmentId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT NOT NULL,

    CONSTRAINT "MarriagePremaritalSessionClinical_pkey" PRIMARY KEY ("journeyId","sessionKey")
);

-- CreateTable
CREATE TABLE "MarriagePremaritalReadinessReview" (
    "journeyId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "strengths" TEXT,
    "areasForDiscussion" TEXT,
    "unresolvedConcerns" TEXT,
    "recommendedNextSteps" TEXT,
    "optionalAdditionalCounseling" TEXT,
    "pastoralRecommendation" TEXT,
    "sessionsOverviewNote" TEXT,
    "homeworkOverviewNote" TEXT,
    "assessmentOverviewNote" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT NOT NULL,

    CONSTRAINT "MarriagePremaritalReadinessReview_pkey" PRIMARY KEY ("journeyId")
);

-- CreateTable
CREATE TABLE "MarriagePremaritalReadinessReviewAudit" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "snapshotJson" TEXT NOT NULL,
    "revisedByUserId" TEXT NOT NULL,
    "revisedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriagePremaritalReadinessReviewAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarriagePremaritalReminderDelivery" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "referenceKey" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriagePremaritalReminderDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarriagePremaritalSessionClinical_journeyId_idx" ON "MarriagePremaritalSessionClinical"("journeyId");

-- CreateIndex
CREATE INDEX "MarriagePremaritalReadinessReviewAudit_journeyId_revisedAt_idx" ON "MarriagePremaritalReadinessReviewAudit"("journeyId", "revisedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarriagePremaritalReminderDelivery_kind_referenceKey_key" ON "MarriagePremaritalReminderDelivery"("kind", "referenceKey");

-- CreateIndex
CREATE INDEX "MarriagePremaritalReminderDelivery_journeyId_idx" ON "MarriagePremaritalReminderDelivery"("journeyId");
