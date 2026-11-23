ALTER TABLE "GuestFollowUpAssignment" ADD COLUMN "nextContactAt" TIMESTAMP(3);
ALTER TABLE "GuestFollowUpAssignment" ADD COLUMN "journeyStage" TEXT NOT NULL DEFAULT 'first_visit';
ALTER TABLE "GuestFollowUpAssignment" ADD COLUMN "lastReminderAt" TIMESTAMP(3);
CREATE INDEX "GuestFollowUpAssignment_nextContactAt_idx" ON "GuestFollowUpAssignment"("nextContactAt");
CREATE TABLE "GuestFollowUpMessage" (
 "id" TEXT NOT NULL,
 "guestId" TEXT NOT NULL,
 "channel" TEXT NOT NULL,
 "templateKey" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'draft',
 "scheduledAt" TIMESTAMP(3),
 "sentAt" TIMESTAMP(3),
 "error" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "GuestFollowUpMessage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GuestFollowUpMessage_guestId_channel_templateKey_key" ON "GuestFollowUpMessage"("guestId","channel","templateKey");
CREATE INDEX "GuestFollowUpMessage_status_scheduledAt_idx" ON "GuestFollowUpMessage"("status","scheduledAt");