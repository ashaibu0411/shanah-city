-- DropIndex
DROP INDEX "GroupJoinRequest_groupId_idx";

-- DropIndex
DROP INDEX "GroupJoinRequest_status_idx";

-- DropIndex
DROP INDEX "GroupJoinRequest_userId_idx";

-- DropIndex
DROP INDEX "PasswordResetToken_userId_idx";

-- DropIndex
DROP INDEX "WorshipSongLibrary_youtubeVideoId_idx";

-- CreateTable
CREATE TABLE "MinistryLeaderReport" (
    "id" TEXT NOT NULL,
    "reportMonth" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "responses" JSONB NOT NULL,
    "leaderNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "submittedByName" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedByName" TEXT,
    "reviewerNotes" TEXT,
    "actionSteps" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MinistryLeaderReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MinistryLeaderReport_reportMonth_idx" ON "MinistryLeaderReport"("reportMonth");

-- CreateIndex
CREATE INDEX "MinistryLeaderReport_groupId_idx" ON "MinistryLeaderReport"("groupId");

-- CreateIndex
CREATE INDEX "MinistryLeaderReport_status_idx" ON "MinistryLeaderReport"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MinistryLeaderReport_reportMonth_groupId_key" ON "MinistryLeaderReport"("reportMonth", "groupId");
