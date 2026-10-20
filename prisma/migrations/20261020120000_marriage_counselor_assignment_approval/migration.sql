-- Phase 3M: Senior Pastor approval workflow for clinical counselor assignment

CREATE TABLE "MarriageCounselorAssignmentRequest" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "requestedCounselorUserId" TEXT,
    "previousCounselorUserId" TEXT,
    "status" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "MarriageCounselorAssignmentRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarriageCounselorAssignmentRequest_journeyId_status_idx" ON "MarriageCounselorAssignmentRequest"("journeyId", "status");

CREATE TABLE "MarriageCounselorAssignmentAcknowledgment" (
    "requestId" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "counselorUserId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriageCounselorAssignmentAcknowledgment_pkey" PRIMARY KEY ("requestId","userId")
);

CREATE INDEX "MarriageCounselorAssignmentAcknowledgment_journeyId_idx" ON "MarriageCounselorAssignmentAcknowledgment"("journeyId");

CREATE TABLE "MarriageCounselorParticipantRevocation" (
    "journeyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriageCounselorParticipantRevocation_pkey" PRIMARY KEY ("journeyId","userId")
);
