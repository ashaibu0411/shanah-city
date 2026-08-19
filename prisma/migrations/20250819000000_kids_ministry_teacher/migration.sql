-- AlterTable
ALTER TABLE "User" ADD COLUMN "notifyKids" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "FamilyMember" ADD COLUMN "allergies" TEXT;
ALTER TABLE "FamilyMember" ADD COLUMN "medicalNotes" TEXT;
ALTER TABLE "FamilyMember" ADD COLUMN "authorizedPickup" JSONB;

-- AlterTable
ALTER TABLE "KidCheckIn" ADD COLUMN "parentUserId" TEXT;
ALTER TABLE "KidCheckIn" ADD COLUMN "familyMemberId" TEXT;
ALTER TABLE "KidCheckIn" ADD COLUMN "allergies" TEXT;
ALTER TABLE "KidCheckIn" ADD COLUMN "medicalNotes" TEXT;
ALTER TABLE "KidCheckIn" ADD COLUMN "authorizedPickup" JSONB;
ALTER TABLE "KidCheckIn" ADD COLUMN "checkedOutBy" TEXT;
ALTER TABLE "KidCheckIn" ADD COLUMN "pickupVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "KidCheckIn" ADD COLUMN "pickupVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "KidsLesson" (
    "id" TEXT NOT NULL,
    "weekStarting" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KidsLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KidsIncident" (
    "id" TEXT NOT NULL,
    "checkInId" TEXT,
    "childName" TEXT NOT NULL,
    "parentUserId" TEXT,
    "ageGroup" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "actionTaken" TEXT,
    "reportedBy" TEXT NOT NULL,
    "reportedByName" TEXT NOT NULL,
    "parentNotified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KidsIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KidsLesson_weekStarting_ageGroup_key" ON "KidsLesson"("weekStarting", "ageGroup");
