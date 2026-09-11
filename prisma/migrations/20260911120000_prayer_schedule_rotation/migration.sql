-- AlterTable
ALTER TABLE "WorshipScheduleRotation" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "WorshipScheduleRotation" ADD COLUMN "publishedAt" TIMESTAMP(3);
ALTER TABLE "WorshipScheduleRotation" ADD COLUMN "scheduleNotifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PrayerScheduleRotation" (
    "id" TEXT NOT NULL,
    "slotType" TEXT NOT NULL,
    "pool" JSONB NOT NULL DEFAULT '[]',
    "rotationIndex" INTEGER NOT NULL DEFAULT 0,
    "skipDates" JSONB NOT NULL DEFAULT '[]',
    "weeksAhead" INTEGER NOT NULL DEFAULT 8,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "scheduleNotifiedAt" TIMESTAMP(3),
    "updatedBy" TEXT,
    "updatedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrayerScheduleRotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrayerAssignment" (
    "id" TEXT NOT NULL,
    "slotType" TEXT NOT NULL,
    "assignmentDate" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrayerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrayerScheduleRotation_slotType_key" ON "PrayerScheduleRotation"("slotType");

-- CreateIndex
CREATE UNIQUE INDEX "PrayerAssignment_slotType_assignmentDate_key" ON "PrayerAssignment"("slotType", "assignmentDate");

-- CreateIndex
CREATE INDEX "PrayerAssignment_userId_idx" ON "PrayerAssignment"("userId");

-- CreateIndex
CREATE INDEX "PrayerAssignment_slotType_assignmentDate_idx" ON "PrayerAssignment"("slotType", "assignmentDate");

-- CreateIndex
CREATE INDEX "PrayerAssignment_status_idx" ON "PrayerAssignment"("status");
