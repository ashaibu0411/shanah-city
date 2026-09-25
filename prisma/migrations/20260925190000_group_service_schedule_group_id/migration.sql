ALTER TABLE "ChoirServiceSchedule" ADD COLUMN "groupId" TEXT NOT NULL DEFAULT 'group-choir';

CREATE INDEX "ChoirServiceSchedule_groupId_serviceDate_idx" ON "ChoirServiceSchedule"("groupId", "serviceDate");
