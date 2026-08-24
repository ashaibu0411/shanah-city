-- AlterTable
ALTER TABLE "LiveStreamSchedule" ADD COLUMN "notifyEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LiveStreamSchedule" ADD COLUMN "notifyBody" TEXT;
ALTER TABLE "LiveStreamSchedule" ADD COLUMN "notifySentAt" TIMESTAMP(3);
