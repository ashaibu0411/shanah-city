-- CreateTable
CREATE TABLE "FinanceWeeklySheet" (
    "id" TEXT NOT NULL,
    "weekEnding" TEXT NOT NULL,
    "lines" JSONB NOT NULL,
    "notes" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "submittedByName" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceWeeklySheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinanceWeeklySheet_weekEnding_key" ON "FinanceWeeklySheet"("weekEnding");

-- CreateIndex
CREATE INDEX "FinanceWeeklySheet_status_idx" ON "FinanceWeeklySheet"("status");

-- CreateIndex
CREATE INDEX "FinanceWeeklySheet_weekEnding_idx" ON "FinanceWeeklySheet"("weekEnding");
