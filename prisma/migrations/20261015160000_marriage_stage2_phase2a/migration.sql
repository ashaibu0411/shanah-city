-- Phase 2A: sharing consent + activity sync sessions (additive).

CREATE TABLE "MarriageSharingConsent" (
    "journeyId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriageSharingConsent_pkey" PRIMARY KEY ("journeyId","moduleId","questionId","userId")
);

CREATE TABLE "MarriageActivitySyncSession" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "startedByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriageActivitySyncSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarriageSharingConsent_journeyId_moduleId_idx" ON "MarriageSharingConsent"("journeyId", "moduleId");
CREATE INDEX "MarriageActivitySyncSession_journeyId_moduleId_status_idx" ON "MarriageActivitySyncSession"("journeyId", "moduleId", "status");
