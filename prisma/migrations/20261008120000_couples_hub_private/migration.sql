-- Couples Hub: private marriage workspace (calendar, notes, check-ins, goals, devotionals, games)

CREATE TABLE "CoupleCalendarEvent" (
    "id" TEXT NOT NULL,
    "coupleLinkId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'America/Denver',
    "recurrence" TEXT,
    "reminderMin" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoupleCalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CoupleCalendarEvent_coupleLinkId_startAt_idx" ON "CoupleCalendarEvent"("coupleLinkId", "startAt");

CREATE TABLE "CoupleLoveNote" (
    "id" TEXT NOT NULL,
    "coupleLinkId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "noteType" TEXT NOT NULL DEFAULT 'appreciation',
    "body" TEXT NOT NULL,
    "scriptureRef" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoupleLoveNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CoupleLoveNote_coupleLinkId_createdAt_idx" ON "CoupleLoveNote"("coupleLinkId", "createdAt");

CREATE TABLE "CoupleCheckInWeek" (
    "id" TEXT NOT NULL,
    "coupleLinkId" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoupleCheckInWeek_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoupleCheckInWeek_coupleLinkId_weekStart_key" ON "CoupleCheckInWeek"("coupleLinkId", "weekStart");

CREATE TABLE "CoupleCheckInAnswer" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "reflection" TEXT,
    "shareWithSpouse" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoupleCheckInAnswer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoupleCheckInAnswer_weekId_userId_dimension_key" ON "CoupleCheckInAnswer"("weekId", "userId", "dimension");

CREATE TABLE "CouplePrayerJournalEntry" (
    "id" TEXT NOT NULL,
    "coupleLinkId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'praying',
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CouplePrayerJournalEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CouplePrayerJournalEntry_coupleLinkId_status_idx" ON "CouplePrayerJournalEntry"("coupleLinkId", "status");

CREATE TABLE "CoupleMarriageGoal" (
    "id" TEXT NOT NULL,
    "coupleLinkId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "milestonesJson" TEXT NOT NULL DEFAULT '[]',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoupleMarriageGoal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CoupleMarriageGoal_coupleLinkId_idx" ON "CoupleMarriageGoal"("coupleLinkId");

CREATE TABLE "CoupleDateNightPlan" (
    "id" TEXT NOT NULL,
    "coupleLinkId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "budget" TEXT,
    "locationType" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "isSurprise" BOOLEAN NOT NULL DEFAULT false,
    "invitedUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'idea',
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoupleDateNightPlan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CoupleDateNightPlan_coupleLinkId_idx" ON "CoupleDateNightPlan"("coupleLinkId");

CREATE TABLE "CoupleMarriageDevotional" (
    "id" TEXT NOT NULL,
    "publishDate" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scripture" TEXT NOT NULL,
    "teaching" TEXT NOT NULL,
    "discussion" TEXT NOT NULL,
    "assignment" TEXT NOT NULL,
    "prayer" TEXT NOT NULL,
    "declaration" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoupleMarriageDevotional_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CoupleMarriageDevotional_publishDate_published_idx" ON "CoupleMarriageDevotional"("publishDate", "published");

CREATE TABLE "CoupleDevotionalRead" (
    "coupleLinkId" TEXT NOT NULL,
    "devotionalId" TEXT NOT NULL,
    "readByUserId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoupleDevotionalRead_pkey" PRIMARY KEY ("coupleLinkId","devotionalId","readByUserId")
);

CREATE TABLE "CoupleGameState" (
    "id" TEXT NOT NULL,
    "coupleLinkId" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "stateJson" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoupleGameState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoupleGameState_coupleLinkId_gameType_key" ON "CoupleGameState"("coupleLinkId", "gameType");

CREATE TABLE "CoupleHubAnnouncement" (
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedBy" TEXT,
    "updatedByName" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoupleHubAnnouncement_pkey" PRIMARY KEY ("groupId")
);
