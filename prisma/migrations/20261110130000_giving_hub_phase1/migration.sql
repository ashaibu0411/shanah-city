-- Giving Hub Phase 1 — payment method config + off-platform intents (additive)

CREATE TABLE "GivingHubPaymentMethod" (
    "id" TEXT NOT NULL,
    "methodKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "recipientValue" TEXT,
    "copyHint" TEXT,
    "externalUrl" TEXT,
    "tone" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GivingHubPaymentMethod_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GivingHubPaymentMethod_methodKey_key" ON "GivingHubPaymentMethod"("methodKey");
CREATE INDEX "GivingHubPaymentMethod_published_enabled_sortOrder_idx" ON "GivingHubPaymentMethod"("published", "enabled", "sortOrder");

CREATE TABLE "GivingHubOffPlatformIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "methodKey" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "fund" TEXT NOT NULL,
    "donorNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending_finance',
    "financeNote" TEXT,
    "matchedRecordId" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GivingHubOffPlatformIntent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GivingHubOffPlatformIntent_userId_createdAt_idx" ON "GivingHubOffPlatformIntent"("userId", "createdAt" DESC);
CREATE INDEX "GivingHubOffPlatformIntent_status_createdAt_idx" ON "GivingHubOffPlatformIntent"("status", "createdAt" DESC);
CREATE INDEX "GivingHubOffPlatformIntent_methodKey_idx" ON "GivingHubOffPlatformIntent"("methodKey");

-- Unverified recipients — not published until Finance verifies ownership
INSERT INTO "GivingHubPaymentMethod" (
    "id", "methodKey", "displayName", "description", "action",
    "recipientValue", "copyHint", "tone", "sortOrder", "enabled", "published", "updatedAt"
) VALUES
(
    'ghub-zelle-pending',
    'zelle',
    'Zelle',
    'Send from your bank app using the church Zelle contact Finance has verified.',
    'copy',
    'finance@shanahcityt.org',
    'Zelle email',
    'from-violet-600 to-purple-700',
    10,
    false,
    false,
    CURRENT_TIMESTAMP
),
(
    'ghub-cashapp-pending',
    'cashapp',
    'Cash App',
    'Open Cash App to give to the church verified $Cashtag.',
    'link',
    'shanahcenter',
    NULL,
    'from-green-500 to-emerald-700',
    20,
    false,
    false,
    CURRENT_TIMESTAMP
);
