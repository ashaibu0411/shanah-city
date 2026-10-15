-- Marriage Counseling Hub (Stage 1) — additive only; does not modify existing tables or data.

CREATE TABLE "MarriageCounselingJourney" (
    "id" TEXT NOT NULL,
    "coupleLinkId" TEXT NOT NULL DEFAULT '',
    "programType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentModuleId" TEXT,
    "counselorUserId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "pairingMode" TEXT NOT NULL DEFAULT 'spouse_link',
    "participantAId" TEXT,
    "participantBId" TEXT,
    "guidedModuleIdsJson" TEXT,
    "curriculumVersion" TEXT,
    "counselorAccessRevokedAt" TIMESTAMP(3),
    "deletionRequestedAt" TIMESTAMP(3),

    CONSTRAINT "MarriageCounselingJourney_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarriageJourneyConsent" (
    "journeyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriageJourneyConsent_pkey" PRIMARY KEY ("journeyId","userId")
);

CREATE TABLE "MarriageAssessmentResponse" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "contentVersion" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "answersJson" TEXT NOT NULL,
    "lastSavedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "revisionGeneration" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MarriageAssessmentResponse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarriageComparisonUnlock" (
    "journeyId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "contentVersion" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriageComparisonUnlock_pkey" PRIMARY KEY ("journeyId","moduleId","contentVersion")
);

CREATE TABLE "MarriageJournalEntry" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "visibility" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "moduleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriageJournalEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarriageCounselingSession" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "zoomUrl" TEXT,
    "notes" TEXT,
    "topic" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "prepModuleIdsJson" TEXT,
    "homeworkAssignmentIdsJson" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "MarriageCounselingSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarriageCounselorAssignment" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "counselorUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "moduleId" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedByJson" TEXT NOT NULL DEFAULT '[]',
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriageCounselorAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarriageJourneyInvite" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "intendedEmail" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "acceptedByUserId" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriageJourneyInvite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarriageRevisionRequest" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "MarriageRevisionRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarriageAuditLog" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "journeyId" TEXT,
    "targetUserId" TEXT,
    "metaJson" TEXT,

    CONSTRAINT "MarriageAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarriageDiscussionMark" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "markedByUserId" TEXT NOT NULL,
    "sharedNote" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriageDiscussionMark_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarriageCounselorNote" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "counselorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriageCounselorNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarriageCurriculumVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "modulesJson" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "basedOnVersion" TEXT,

    CONSTRAINT "MarriageCurriculumVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarriageProgramTrack" (
    "programType" TEXT NOT NULL,
    "entriesJson" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "MarriageProgramTrack_pkey" PRIMARY KEY ("programType")
);

CREATE UNIQUE INDEX "MarriageAssessmentResponse_journeyId_moduleId_userId_key" ON "MarriageAssessmentResponse"("journeyId", "moduleId", "userId");
CREATE INDEX "MarriageAssessmentResponse_journeyId_moduleId_idx" ON "MarriageAssessmentResponse"("journeyId", "moduleId");
CREATE INDEX "MarriageCounselingJourney_coupleLinkId_idx" ON "MarriageCounselingJourney"("coupleLinkId");
CREATE INDEX "MarriageCounselingJourney_counselorUserId_idx" ON "MarriageCounselingJourney"("counselorUserId");
CREATE INDEX "MarriageCounselingJourney_status_idx" ON "MarriageCounselingJourney"("status");
CREATE INDEX "MarriageCounselingJourney_participantAId_idx" ON "MarriageCounselingJourney"("participantAId");
CREATE INDEX "MarriageCounselingJourney_participantBId_idx" ON "MarriageCounselingJourney"("participantBId");
CREATE INDEX "MarriageJournalEntry_journeyId_createdAt_idx" ON "MarriageJournalEntry"("journeyId", "createdAt");
CREATE INDEX "MarriageCounselingSession_journeyId_scheduledAt_idx" ON "MarriageCounselingSession"("journeyId", "scheduledAt");
CREATE INDEX "MarriageCounselorAssignment_journeyId_dueAt_idx" ON "MarriageCounselorAssignment"("journeyId", "dueAt");
CREATE UNIQUE INDEX "MarriageJourneyInvite_code_key" ON "MarriageJourneyInvite"("code");
CREATE INDEX "MarriageJourneyInvite_journeyId_idx" ON "MarriageJourneyInvite"("journeyId");
CREATE INDEX "MarriageRevisionRequest_journeyId_status_idx" ON "MarriageRevisionRequest"("journeyId", "status");
CREATE INDEX "MarriageAuditLog_journeyId_at_idx" ON "MarriageAuditLog"("journeyId", "at");
CREATE UNIQUE INDEX "MarriageDiscussionMark_journeyId_moduleId_questionId_markedByUserId_key" ON "MarriageDiscussionMark"("journeyId", "moduleId", "questionId", "markedByUserId");
CREATE INDEX "MarriageDiscussionMark_journeyId_moduleId_idx" ON "MarriageDiscussionMark"("journeyId", "moduleId");
CREATE INDEX "MarriageCounselorNote_journeyId_idx" ON "MarriageCounselorNote"("journeyId");
CREATE INDEX "MarriageCurriculumVersion_status_idx" ON "MarriageCurriculumVersion"("status");
CREATE INDEX "MarriageCurriculumVersion_version_idx" ON "MarriageCurriculumVersion"("version");
