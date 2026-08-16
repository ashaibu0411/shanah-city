-- CreateTable
CREATE TABLE "GivingRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "donorName" TEXT NOT NULL,
    "donorEmail" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "fund" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "givenOn" TEXT NOT NULL,
    "campusId" TEXT,
    "notes" TEXT,
    "recordedBy" TEXT NOT NULL,
    "recordedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GivingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GivingRecord_givenOn_idx" ON "GivingRecord"("givenOn");

-- CreateIndex
CREATE INDEX "GivingRecord_userId_idx" ON "GivingRecord"("userId");

-- CreateIndex
CREATE INDEX "GivingRecord_fund_idx" ON "GivingRecord"("fund");
