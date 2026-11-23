CREATE TABLE "GuestFollowUpAssignment" (
 "guestId" TEXT NOT NULL,
 "workerId" TEXT NOT NULL,
 "workerName" TEXT NOT NULL,
 "assignedById" TEXT NOT NULL,
 "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "dueAt" TIMESTAMP(3) NOT NULL,
 "completedAt" TIMESTAMP(3),
 CONSTRAINT "GuestFollowUpAssignment_pkey" PRIMARY KEY ("guestId")
);
CREATE INDEX "GuestFollowUpAssignment_workerId_completedAt_dueAt_idx" ON "GuestFollowUpAssignment"("workerId", "completedAt", "dueAt");
CREATE INDEX "GuestFollowUpAssignment_dueAt_completedAt_idx" ON "GuestFollowUpAssignment"("dueAt", "completedAt");
