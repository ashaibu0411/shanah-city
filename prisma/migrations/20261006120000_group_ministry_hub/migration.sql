CREATE TABLE "GroupMinistryHubAnnouncement" (
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedBy" TEXT,
    "updatedByName" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupMinistryHubAnnouncement_pkey" PRIMARY KEY ("groupId")
);

CREATE TABLE "GroupMinistryPrayerPost" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'prayer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMinistryPrayerPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GroupMinistryPrayerPost_groupId_createdAt_idx" ON "GroupMinistryPrayerPost"("groupId", "createdAt");
