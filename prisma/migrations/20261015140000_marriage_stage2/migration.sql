-- Stage 2: action plans and shared goals (additive).

CREATE TABLE "MarriageActionPlan" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "moduleId" TEXT,
    "title" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "itemsJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "agreedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriageActionPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarriageSharedGoal" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "acknowledgedByJson" TEXT NOT NULL DEFAULT '[]',
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriageSharedGoal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarriageActionPlan_journeyId_updatedAt_idx" ON "MarriageActionPlan"("journeyId", "updatedAt");
CREATE INDEX "MarriageSharedGoal_journeyId_updatedAt_idx" ON "MarriageSharedGoal"("journeyId", "updatedAt");
