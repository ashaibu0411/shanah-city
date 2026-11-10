CREATE TABLE "GivingStripeGiftRecoveryAudit" (
    "id" TEXT NOT NULL,
    "memberUserId" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "requestedByUserId" TEXT NOT NULL,
    "requestedByName" TEXT NOT NULL,
    "ownershipBasis" TEXT,
    "giftAmount" DOUBLE PRECISION NOT NULL,
    "feeAmount" DOUBLE PRECISION,
    "givenOn" TEXT NOT NULL,
    "successAtVerified" BOOLEAN NOT NULL,
    "outcome" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GivingStripeGiftRecoveryAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GivingStripeGiftRecoveryAudit_memberUserId_createdAt_idx" ON "GivingStripeGiftRecoveryAudit"("memberUserId", "createdAt" DESC);
CREATE INDEX "GivingStripeGiftRecoveryAudit_stripeSessionId_idx" ON "GivingStripeGiftRecoveryAudit"("stripeSessionId");
CREATE INDEX "GivingStripeGiftRecoveryAudit_outcome_idx" ON "GivingStripeGiftRecoveryAudit"("outcome");
