CREATE TABLE "VisionMilestone" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueOn" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VisionMilestone_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "VisionReminderDelivery" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VisionReminderDelivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VisionMilestone_planId_assigneeId_kind_period_key" ON "VisionMilestone"("planId", "assigneeId", "kind", "period");
CREATE INDEX "VisionMilestone_assigneeId_status_dueOn_idx" ON "VisionMilestone"("assigneeId", "status", "dueOn");
CREATE INDEX "VisionMilestone_planId_dueOn_idx" ON "VisionMilestone"("planId", "dueOn");
CREATE UNIQUE INDEX "VisionReminderDelivery_milestoneId_recipientId_key_key" ON "VisionReminderDelivery"("milestoneId", "recipientId", "key");
ALTER TABLE "VisionMilestone" ADD CONSTRAINT "VisionMilestone_planId_fkey" FOREIGN KEY ("planId") REFERENCES "VisionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VisionReminderDelivery" ADD CONSTRAINT "VisionReminderDelivery_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "VisionMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
