-- AlterTable
ALTER TABLE "ChurchEvent" ADD COLUMN "startsOn" TEXT;
ALTER TABLE "ChurchEvent" ADD COLUMN "endsOn" TEXT;
ALTER TABLE "ChurchEvent" ADD COLUMN "recurringWeekday" INTEGER;

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "joinUrl" TEXT,
    "location" TEXT,
    "meetingId" TEXT,
    "passcode" TEXT,
    "startsOn" TEXT,
    "endsOn" TEXT,
    "recurringWeekday" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);
