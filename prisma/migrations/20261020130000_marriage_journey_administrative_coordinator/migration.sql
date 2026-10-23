-- Phase 3M Step 2B: administrative coordinator scope (separate from clinical counselor)

CREATE TABLE "MarriageJourneyAdministrativeCoordinator" (
    "journeyId" TEXT NOT NULL,
    "coordinatorUserId" TEXT NOT NULL,
    "assignedByUserId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriageJourneyAdministrativeCoordinator_pkey" PRIMARY KEY ("journeyId")
);

CREATE INDEX "MarriageJourneyAdministrativeCoordinator_coordinatorUserId_idx" ON "MarriageJourneyAdministrativeCoordinator"("coordinatorUserId");
