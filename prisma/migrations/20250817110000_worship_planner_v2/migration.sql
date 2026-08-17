-- AlterTable User
ALTER TABLE "User" ADD COLUMN "notifyWorship" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable WorshipServicePlan
ALTER TABLE "WorshipServicePlan" ADD COLUMN "rehearsalDate" TEXT;
ALTER TABLE "WorshipServicePlan" ADD COLUMN "rehearsalTime" TEXT;
ALTER TABLE "WorshipServicePlan" ADD COLUMN "calendarEventId" TEXT;
ALTER TABLE "WorshipServicePlan" ADD COLUMN "serviceType" TEXT NOT NULL DEFAULT 'sunday';
ALTER TABLE "WorshipServicePlan" ADD COLUMN "reminderSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "WorshipSongLibrary" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "defaultKey" TEXT NOT NULL DEFAULT 'C',
    "bpm" INTEGER,
    "ccliNumber" TEXT,
    "chartUrl" TEXT,
    "chartFileName" TEXT,
    "notes" TEXT,
    "tags" JSONB,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorshipSongLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorshipSongLibrary_title_idx" ON "WorshipSongLibrary"("title");

-- CreateIndex
CREATE INDEX "WorshipServicePlan_calendarEventId_idx" ON "WorshipServicePlan"("calendarEventId");
