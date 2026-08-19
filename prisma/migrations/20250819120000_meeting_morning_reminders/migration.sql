-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN "recurringWeekdays" TEXT;
ALTER TABLE "Meeting" ADD COLUMN "notifyEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Meeting" ADD COLUMN "lastNotifiedOn" TEXT;
