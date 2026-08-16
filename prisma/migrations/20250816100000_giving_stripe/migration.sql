-- AlterTable
ALTER TABLE "GivingRecord" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "GivingRecord" ADD COLUMN "stripeSessionId" TEXT;
ALTER TABLE "GivingRecord" ADD COLUMN "stripeInvoiceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GivingRecord_stripeSessionId_key" ON "GivingRecord"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "GivingRecord_stripeInvoiceId_key" ON "GivingRecord"("stripeInvoiceId");
