-- Session-based marriage prep homework (draft/release, per-partner responses)

CREATE TABLE "MarriageSessionHomework" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "counselorUserId" TEXT NOT NULL,
    "sessionId" TEXT,
    "templateKey" TEXT,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "dueAt" TIMESTAMP(3),
    "dueAtTimeZone" TEXT,
    "activitiesJson" TEXT NOT NULL,
    "counselorPrivateNotes" TEXT,
    "partnerFeedbackJson" TEXT,
    "releasedAt" TIMESTAMP(3),
    "reopenedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriageSessionHomework_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarriageSessionHomework_journeyId_status_idx" ON "MarriageSessionHomework"("journeyId", "status");
CREATE INDEX "MarriageSessionHomework_journeyId_templateKey_idx" ON "MarriageSessionHomework"("journeyId", "templateKey");

CREATE TABLE "MarriageSessionHomeworkResponse" (
    "homeworkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answersJson" TEXT NOT NULL DEFAULT '{}',
    "lastSavedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "MarriageSessionHomeworkResponse_pkey" PRIMARY KEY ("homeworkId","userId")
);

CREATE INDEX "MarriageSessionHomeworkResponse_homeworkId_idx" ON "MarriageSessionHomeworkResponse"("homeworkId");
