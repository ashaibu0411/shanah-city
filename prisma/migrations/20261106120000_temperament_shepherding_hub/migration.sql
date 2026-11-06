-- Temperament & Shepherding Hub (pilot: worship department). Additive only.

CREATE TABLE "TemperamentAssessmentResponse" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "departmentKey" TEXT NOT NULL,
  "contentVersion" TEXT NOT NULL,
  "assessmentKind" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "answersJson" TEXT NOT NULL,
  "dataUseConsentAt" TIMESTAMP(3),
  "leaderShareConsentAt" TIMESTAMP(3),
  "shareSnapshotWithLeader" BOOLEAN NOT NULL DEFAULT false,
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TemperamentAssessmentResponse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TemperamentAssessmentResponse_userId_departmentKey_contentVersion_assessmentKind_key"
  ON "TemperamentAssessmentResponse"("userId", "departmentKey", "contentVersion", "assessmentKind");

CREATE INDEX "TemperamentAssessmentResponse_departmentKey_status_idx"
  ON "TemperamentAssessmentResponse"("departmentKey", "status");
CREATE INDEX "TemperamentAssessmentResponse_userId_idx"
  ON "TemperamentAssessmentResponse"("userId");

CREATE TABLE "TemperamentAssessmentSnapshot" (
  "id" TEXT NOT NULL,
  "responseId" TEXT NOT NULL,
  "scoresJson" TEXT NOT NULL,
  "highlightsJson" TEXT NOT NULL,
  "guidanceJson" TEXT NOT NULL,
  "disclaimer" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TemperamentAssessmentSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TemperamentAssessmentSnapshot_responseId_key"
  ON "TemperamentAssessmentSnapshot"("responseId");

CREATE TABLE "TemperamentAssessmentInvitation" (
  "id" TEXT NOT NULL,
  "departmentKey" TEXT NOT NULL,
  "inviterUserId" TEXT NOT NULL,
  "inviteeUserId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TemperamentAssessmentInvitation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TemperamentAssessmentInvitation_departmentKey_inviteeUserId_idx"
  ON "TemperamentAssessmentInvitation"("departmentKey", "inviteeUserId");
CREATE INDEX "TemperamentAssessmentInvitation_departmentKey_status_idx"
  ON "TemperamentAssessmentInvitation"("departmentKey", "status");

CREATE TABLE "TemperamentShepherdingAudit" (
  "id" TEXT NOT NULL,
  "departmentKey" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetUserId" TEXT,
  "summary" TEXT NOT NULL,
  "metaJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TemperamentShepherdingAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TemperamentShepherdingAudit_departmentKey_createdAt_idx"
  ON "TemperamentShepherdingAudit"("departmentKey", "createdAt");
