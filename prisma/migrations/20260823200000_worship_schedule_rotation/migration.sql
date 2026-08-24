-- AlterTable
ALTER TABLE "WorshipServicePlan" ADD COLUMN "uploadDutyUserId" TEXT;
ALTER TABLE "WorshipServicePlan" ADD COLUMN "uploadDutyUserName" TEXT;
ALTER TABLE "WorshipServicePlan" ADD COLUMN "uploadDutyReminderSentAt" TIMESTAMP(3);
ALTER TABLE "WorshipServicePlan" ADD COLUMN "memberSuggestions" JSONB NOT NULL DEFAULT '[]';

-- CreateIndex
CREATE INDEX "WorshipServicePlan_uploadDutyUserId_idx" ON "WorshipServicePlan"("uploadDutyUserId");

-- CreateTable
CREATE TABLE "WorshipScheduleRotation" (
    "id" TEXT NOT NULL,
    "pool" JSONB NOT NULL DEFAULT '[]',
    "serviceTime" TEXT NOT NULL DEFAULT '10:00',
    "serviceKind" TEXT NOT NULL DEFAULT 'sunday',
    "rotationIndex" INTEGER NOT NULL DEFAULT 0,
    "skipDates" JSONB NOT NULL DEFAULT '[]',
    "weeksAhead" INTEGER NOT NULL DEFAULT 8,
    "uploadDutyLeadDays" INTEGER NOT NULL DEFAULT 4,
    "updatedBy" TEXT,
    "updatedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorshipScheduleRotation_pkey" PRIMARY KEY ("id")
);
