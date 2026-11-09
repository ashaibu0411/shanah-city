CREATE TABLE "GivingStripeMemberSyncRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recorded" INTEGER NOT NULL DEFAULT 0,
    "linked" INTEGER NOT NULL DEFAULT 0,
    "flagged" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GivingStripeMemberSyncRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GivingStripeMemberSyncRun_userId_createdAt_idx" ON "GivingStripeMemberSyncRun"("userId", "createdAt" DESC);

CREATE TABLE "GivingStripeMemberSyncReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "stripeInvoiceId" TEXT,
    "reason" TEXT NOT NULL,
    "metadataUserId" TEXT,
    "clientReferenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "GivingStripeMemberSyncReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GivingStripeMemberSyncReview_stripeSessionId_key" ON "GivingStripeMemberSyncReview"("stripeSessionId");

CREATE UNIQUE INDEX "GivingStripeMemberSyncReview_stripeInvoiceId_key" ON "GivingStripeMemberSyncReview"("stripeInvoiceId");

CREATE INDEX "GivingStripeMemberSyncReview_userId_idx" ON "GivingStripeMemberSyncReview"("userId");

CREATE INDEX "GivingStripeMemberSyncReview_resolvedAt_idx" ON "GivingStripeMemberSyncReview"("resolvedAt");
