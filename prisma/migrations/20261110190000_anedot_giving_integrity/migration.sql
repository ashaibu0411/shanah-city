ALTER TABLE "GivingRecord" ADD COLUMN "effectiveAmount" DOUBLE PRECISION;
ALTER TABLE "GivingRecord" ADD COLUMN "anedotReversalStatus" TEXT NOT NULL DEFAULT 'none';

ALTER TABLE "GivingAnedotDonationLedger" ADD COLUMN "lifecycleRank" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "GivingAnedotDonationLedger" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "GivingAnedotDonationLedger" ADD COLUMN "effectiveAmount" DOUBLE PRECISION;
ALTER TABLE "GivingAnedotDonationLedger" ADD COLUMN "reversedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "GivingAnedotDonationLedger" ADD COLUMN "actionPageId" TEXT;

CREATE TABLE "GivingAnedotAdjustment" (
    "id" TEXT NOT NULL,
    "anedotDonationId" TEXT NOT NULL,
    "givingRecordId" TEXT,
    "eventType" TEXT NOT NULL,
    "requestId" TEXT,
    "deltaAmount" DOUBLE PRECISION NOT NULL,
    "effectiveAfter" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GivingAnedotAdjustment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GivingAnedotAdjustment_requestId_key" ON "GivingAnedotAdjustment"("requestId");
CREATE INDEX "GivingAnedotAdjustment_anedotDonationId_createdAt_idx" ON "GivingAnedotAdjustment"("anedotDonationId", "createdAt" DESC);
CREATE INDEX "GivingAnedotAdjustment_givingRecordId_idx" ON "GivingAnedotAdjustment"("givingRecordId");
