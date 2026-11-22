CREATE TABLE "PushInboxItem" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, "title" TEXT NOT NULL, "body" TEXT NOT NULL, "href" TEXT NOT NULL, "dedupeKey" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "readAt" TIMESTAMP(3), CONSTRAINT "PushInboxItem_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "PushInboxItem_userId_dedupeKey_key" ON "PushInboxItem"("userId", "dedupeKey");
CREATE INDEX "PushInboxItem_userId_readAt_createdAt_idx" ON "PushInboxItem"("userId", "readAt", "createdAt");
