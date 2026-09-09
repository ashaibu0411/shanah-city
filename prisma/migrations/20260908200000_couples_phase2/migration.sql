-- Phase 2: spouse account linking, group resources, private couple prayer wall

CREATE TABLE "CoupleLink" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "CoupleLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoupleLink_userAId_userBId_key" ON "CoupleLink"("userAId", "userBId");
CREATE INDEX "CoupleLink_userAId_idx" ON "CoupleLink"("userAId");
CREATE INDEX "CoupleLink_userBId_idx" ON "CoupleLink"("userBId");
CREATE INDEX "CoupleLink_status_idx" ON "CoupleLink"("status");

CREATE TABLE "GroupResource" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "category" TEXT NOT NULL DEFAULT 'marriage',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupResource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GroupResource_groupId_sortOrder_idx" ON "GroupResource"("groupId", "sortOrder");

CREATE TABLE "CouplePrayerPost" (
    "id" TEXT NOT NULL,
    "coupleLinkId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'prayer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouplePrayerPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CouplePrayerPost_coupleLinkId_createdAt_idx" ON "CouplePrayerPost"("coupleLinkId", "createdAt");
