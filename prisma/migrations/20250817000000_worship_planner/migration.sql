-- CreateTable
CREATE TABLE "WorshipServicePlan" (
    "id" TEXT NOT NULL,
    "serviceDate" TEXT NOT NULL,
    "serviceTime" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "songs" JSONB NOT NULL,
    "team" JSONB NOT NULL,
    "rehearsalNotes" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorshipServicePlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorshipServicePlan_serviceDate_serviceTime_key" ON "WorshipServicePlan"("serviceDate", "serviceTime");

-- CreateIndex
CREATE INDEX "WorshipServicePlan_serviceDate_idx" ON "WorshipServicePlan"("serviceDate");

-- CreateIndex
CREATE INDEX "WorshipServicePlan_status_idx" ON "WorshipServicePlan"("status");
