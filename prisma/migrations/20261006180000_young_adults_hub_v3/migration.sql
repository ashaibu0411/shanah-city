-- Young Adults ministry hub v3: Monday bible study, plans, challenges
CREATE TABLE "GroupMinistryBibleStudy" (
    "groupId" TEXT NOT NULL,
    "leaderUserId" TEXT,
    "leaderName" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "bibleBook" TEXT NOT NULL,
    "meetingWeekday" INTEGER NOT NULL DEFAULT 1,
    "meetingTime" TEXT,
    "reminder1Hour" INTEGER NOT NULL DEFAULT 9,
    "reminder1Minute" INTEGER NOT NULL DEFAULT 0,
    "reminder2Hour" INTEGER NOT NULL DEFAULT 17,
    "reminder2Minute" INTEGER NOT NULL DEFAULT 0,
    "lastReminder1DateKey" TEXT,
    "lastReminder2DateKey" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupMinistryBibleStudy_pkey" PRIMARY KEY ("groupId")
);

CREATE TABLE "GroupMinistryBiblePlan" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "daysJson" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMinistryBiblePlan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GroupMinistryBiblePlan_groupId_active_idx" ON "GroupMinistryBiblePlan"("groupId", "active");

CREATE TABLE "GroupMinistryBiblePlanProgress" (
    "planId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedJson" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupMinistryBiblePlanProgress_pkey" PRIMARY KEY ("planId","userId")
);

CREATE TABLE "GroupMinistryFaithChallenge" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMinistryFaithChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GroupMinistryFaithChallenge_groupId_active_idx" ON "GroupMinistryFaithChallenge"("groupId", "active");

CREATE TABLE "GroupMinistryFaithChallengeCheckIn" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMinistryFaithChallengeCheckIn_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GroupMinistryFaithChallengeCheckIn_challengeId_userId_key" ON "GroupMinistryFaithChallengeCheckIn"("challengeId", "userId");

CREATE INDEX "GroupMinistryFaithChallengeCheckIn_challengeId_idx" ON "GroupMinistryFaithChallengeCheckIn"("challengeId");
