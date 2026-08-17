-- CreateTable
CREATE TABLE "GuestSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "visitDate" TEXT,
    "serviceTime" TEXT,
    "isFirstVisit" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedByName" TEXT,

    CONSTRAINT "GuestSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsherSchedule" (
    "id" TEXT NOT NULL,
    "serviceDate" TEXT NOT NULL,
    "serviceTime" TEXT NOT NULL,
    "ushers" JSONB NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsherSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuestSubmission_status_idx" ON "GuestSubmission"("status");

-- CreateIndex
CREATE INDEX "GuestSubmission_submittedAt_idx" ON "GuestSubmission"("submittedAt");

-- CreateIndex
CREATE INDEX "UsherSchedule_serviceDate_idx" ON "UsherSchedule"("serviceDate");

-- CreateIndex
CREATE INDEX "UsherSchedule_status_idx" ON "UsherSchedule"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UsherSchedule_serviceDate_serviceTime_key" ON "UsherSchedule"("serviceDate", "serviceTime");
