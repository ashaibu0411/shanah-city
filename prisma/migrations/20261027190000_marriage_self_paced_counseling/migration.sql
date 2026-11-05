-- Self-paced counseling delivery mode + counselor review workflow (additive).

ALTER TABLE "MarriageCounselingJourney" ADD COLUMN IF NOT EXISTS "counselingDeliveryMode" TEXT;

CREATE INDEX IF NOT EXISTS "MarriageCounselingJourney_counselingDeliveryMode_idx"
  ON "MarriageCounselingJourney"("counselingDeliveryMode");

CREATE TABLE IF NOT EXISTS "MarriageSelfPacedSessionReview" (
  "id" TEXT NOT NULL,
  "journeyId" TEXT NOT NULL,
  "sessionKey" TEXT NOT NULL,
  "assignedModuleIdsJson" TEXT NOT NULL,
  "workflowStatus" TEXT NOT NULL,
  "assignedByUserId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL,
  "readyForReviewAt" TIMESTAMP(3),
  "feedbackDraftJson" TEXT,
  "feedbackPublishedJson" TEXT,
  "feedbackPublishedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "approvedByUserId" TEXT,
  "pastoralFollowUpAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarriageSelfPacedSessionReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MarriageSelfPacedSessionReview_journeyId_sessionKey_key"
  ON "MarriageSelfPacedSessionReview"("journeyId", "sessionKey");
CREATE INDEX IF NOT EXISTS "MarriageSelfPacedSessionReview_journeyId_workflowStatus_idx"
  ON "MarriageSelfPacedSessionReview"("journeyId", "workflowStatus");
CREATE INDEX IF NOT EXISTS "MarriageSelfPacedSessionReview_workflowStatus_idx"
  ON "MarriageSelfPacedSessionReview"("workflowStatus");

CREATE TABLE IF NOT EXISTS "MarriageSessionClarificationMessage" (
  "id" TEXT NOT NULL,
  "journeyId" TEXT NOT NULL,
  "sessionKey" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "authorRole" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarriageSessionClarificationMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MarriageSessionClarificationMessage_journeyId_sessionKey_createdAt_idx"
  ON "MarriageSessionClarificationMessage"("journeyId", "sessionKey", "createdAt");

CREATE TABLE IF NOT EXISTS "MarriageCounselingDeliveryModeAudit" (
  "id" TEXT NOT NULL,
  "journeyId" TEXT NOT NULL,
  "previousMode" TEXT,
  "newMode" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarriageCounselingDeliveryModeAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MarriageCounselingDeliveryModeAudit_journeyId_createdAt_idx"
  ON "MarriageCounselingDeliveryModeAudit"("journeyId", "createdAt");

CREATE TABLE IF NOT EXISTS "MarriageSelfPacedSessionAudit" (
  "id" TEXT NOT NULL,
  "journeyId" TEXT NOT NULL,
  "sessionKey" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "previousStatus" TEXT,
  "newStatus" TEXT,
  "metaJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarriageSelfPacedSessionAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MarriageSelfPacedSessionAudit_journeyId_sessionKey_createdAt_idx"
  ON "MarriageSelfPacedSessionAudit"("journeyId", "sessionKey", "createdAt");

ALTER TABLE "MarriageSessionHomeworkResponse" ADD COLUMN IF NOT EXISTS "reviewStatus" TEXT NOT NULL DEFAULT 'assigned';
ALTER TABLE "MarriageSessionHomeworkResponse" ADD COLUMN IF NOT EXISTS "revisionNote" TEXT;
ALTER TABLE "MarriageSessionHomeworkResponse" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "MarriageSessionHomeworkResponse_reviewStatus_idx"
  ON "MarriageSessionHomeworkResponse"("reviewStatus");
