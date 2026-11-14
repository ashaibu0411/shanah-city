-- Private ministry vision collaboration. No events are published by this migration.
CREATE TABLE "VisionPlan" (
  "id" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "ministryKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdById" TEXT NOT NULL,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VisionPlan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VisionPlan_year_ministryKey_key" ON "VisionPlan"("year","ministryKey");
CREATE INDEX "VisionPlan_status_year_idx" ON "VisionPlan"("status","year");
CREATE TABLE "VisionAssignment" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'assigned',
  "deadline" TIMESTAMP(3),
  "acknowledgedAt" TIMESTAMP(3),
  "capacity" TEXT,
  "proposal" TEXT,
  "supportNeeds" TEXT,
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VisionAssignment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VisionAssignment_planId_userId_key" ON "VisionAssignment"("planId","userId");
CREATE INDEX "VisionAssignment_userId_status_idx" ON "VisionAssignment"("userId","status");
CREATE TABLE "VisionComment" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  "sectionKey" TEXT NOT NULL DEFAULT 'general',
  "body" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'question',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VisionComment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VisionComment_planId_createdAt_idx" ON "VisionComment"("planId","createdAt");
CREATE TABLE "VisionAuditEvent" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "detail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VisionAuditEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VisionAuditEvent_planId_createdAt_idx" ON "VisionAuditEvent"("planId","createdAt");
ALTER TABLE "VisionAssignment" ADD CONSTRAINT "VisionAssignment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "VisionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VisionComment" ADD CONSTRAINT "VisionComment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "VisionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VisionAuditEvent" ADD CONSTRAINT "VisionAuditEvent_planId_fkey" FOREIGN KEY ("planId") REFERENCES "VisionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
