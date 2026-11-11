-- Anedot hosted giving ledger (pre-approval; gated by env flags)

ALTER TABLE "GivingRecord" ADD COLUMN "anedotDonationId" TEXT;

CREATE UNIQUE INDEX "GivingRecord_anedotDonationId_key" ON "GivingRecord"("anedotDonationId");

CREATE TABLE "GivingAnedotIntent" (
    "id" TEXT NOT NULL,
    "intentToken" TEXT NOT NULL,
    "userId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "fund" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "coverFees" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GivingAnedotIntent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GivingAnedotIntent_intentToken_key" ON "GivingAnedotIntent"("intentToken");

CREATE INDEX "GivingAnedotIntent_userId_createdAt_idx" ON "GivingAnedotIntent"("userId", "createdAt" DESC);

CREATE TABLE "GivingAnedotDonationLedger" (
    "anedotDonationId" TEXT NOT NULL,
    "intentId" TEXT,
    "userId" TEXT,
    "fund" TEXT,
    "grossAmount" DOUBLE PRECISION,
    "netAmount" DOUBLE PRECISION,
    "feeAmount" DOUBLE PRECISION,
    "paymentSource" TEXT,
    "lifecycleStatus" TEXT NOT NULL,
    "givingRecordId" TEXT,
    "commitmentUid" TEXT,
    "settlementAt" TIMESTAMP(3),
    "lastEventType" TEXT NOT NULL,
    "lastEventAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GivingAnedotDonationLedger_pkey" PRIMARY KEY ("anedotDonationId")
);

CREATE UNIQUE INDEX "GivingAnedotDonationLedger_givingRecordId_key" ON "GivingAnedotDonationLedger"("givingRecordId");

CREATE INDEX "GivingAnedotDonationLedger_userId_idx" ON "GivingAnedotDonationLedger"("userId");

CREATE INDEX "GivingAnedotDonationLedger_lifecycleStatus_idx" ON "GivingAnedotDonationLedger"("lifecycleStatus");

CREATE TABLE "GivingAnedotWebhookEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "anedotDonationId" TEXT,
    "eventType" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GivingAnedotWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GivingAnedotWebhookEvent_requestId_key" ON "GivingAnedotWebhookEvent"("requestId");

CREATE INDEX "GivingAnedotWebhookEvent_anedotDonationId_createdAt_idx" ON "GivingAnedotWebhookEvent"("anedotDonationId", "createdAt" DESC);
