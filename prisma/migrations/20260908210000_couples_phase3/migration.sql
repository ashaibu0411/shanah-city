-- Phase 3: anniversary, mentor matching, enrichment track

ALTER TABLE "CoupleLink" ADD COLUMN "anniversaryDate" TEXT;

CREATE TABLE "CoupleMentorRequest" (
    "id" TEXT NOT NULL,
    "coupleLinkId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "mentorLinkId" TEXT,
    "matchedBy" TEXT,
    "matchedByName" TEXT,
    "matchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoupleMentorRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CoupleMentorRequest_coupleLinkId_idx" ON "CoupleMentorRequest"("coupleLinkId");
CREATE INDEX "CoupleMentorRequest_status_idx" ON "CoupleMentorRequest"("status");

CREATE TABLE "CoupleEnrichmentModule" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoupleEnrichmentModule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CoupleEnrichmentModule_groupId_sortOrder_idx" ON "CoupleEnrichmentModule"("groupId", "sortOrder");

CREATE TABLE "CoupleEnrichmentProgress" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "coupleLinkId" TEXT NOT NULL,
    "completedBy" TEXT NOT NULL,
    "completedByName" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoupleEnrichmentProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoupleEnrichmentProgress_moduleId_coupleLinkId_key" ON "CoupleEnrichmentProgress"("moduleId", "coupleLinkId");
CREATE INDEX "CoupleEnrichmentProgress_coupleLinkId_idx" ON "CoupleEnrichmentProgress"("coupleLinkId");
