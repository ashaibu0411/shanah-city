-- Ask Shepherd Phase 1 — leadership guidance assistant (additive)

CREATE TABLE "AskShepherdAccessGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentKey" TEXT NOT NULL,
    "grantedByUserId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "AskShepherdAccessGrant_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AskShepherdAccessGrant_userId_departmentKey_idx" ON "AskShepherdAccessGrant"("userId", "departmentKey");
CREATE INDEX "AskShepherdAccessGrant_departmentKey_revokedAt_idx" ON "AskShepherdAccessGrant"("departmentKey", "revokedAt");

ALTER TABLE "AskShepherdAccessGrant" ADD CONSTRAINT "AskShepherdAccessGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AskShepherdAccessGrant" ADD CONSTRAINT "AskShepherdAccessGrant_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AskShepherdConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "savedToLibrary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AskShepherdConversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AskShepherdConversation_userId_departmentKey_idx" ON "AskShepherdConversation"("userId", "departmentKey");
CREATE INDEX "AskShepherdConversation_userId_updatedAt_idx" ON "AskShepherdConversation"("userId", "updatedAt");

ALTER TABLE "AskShepherdConversation" ADD CONSTRAINT "AskShepherdConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AskShepherdMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AskShepherdMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AskShepherdMessage_conversationId_createdAt_idx" ON "AskShepherdMessage"("conversationId", "createdAt");

ALTER TABLE "AskShepherdMessage" ADD CONSTRAINT "AskShepherdMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AskShepherdConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AskShepherdAudit" (
    "id" TEXT NOT NULL,
    "departmentKey" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetUserId" TEXT,
    "summary" TEXT NOT NULL,
    "metaJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AskShepherdAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AskShepherdAudit_departmentKey_createdAt_idx" ON "AskShepherdAudit"("departmentKey", "createdAt");
CREATE INDEX "AskShepherdAudit_actorUserId_createdAt_idx" ON "AskShepherdAudit"("actorUserId", "createdAt");

ALTER TABLE "AskShepherdAudit" ADD CONSTRAINT "AskShepherdAudit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AskShepherdUsageDaily" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayUtc" TEXT NOT NULL,
    "chatCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AskShepherdUsageDaily_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AskShepherdUsageDaily_userId_dayUtc_key" ON "AskShepherdUsageDaily"("userId", "dayUtc");

ALTER TABLE "AskShepherdUsageDaily" ADD CONSTRAINT "AskShepherdUsageDaily_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AskShepherdGuidanceSource" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "url" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AskShepherdGuidanceSource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AskShepherdGuidanceSource_slug_key" ON "AskShepherdGuidanceSource"("slug");

CREATE INDEX "AskShepherdGuidanceSource_category_idx" ON "AskShepherdGuidanceSource"("category");

ALTER TABLE "AskShepherdGuidanceSource" ADD CONSTRAINT "AskShepherdGuidanceSource_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
