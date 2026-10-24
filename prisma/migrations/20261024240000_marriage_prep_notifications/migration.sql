-- CreateTable
CREATE TABLE IF NOT EXISTS "MarriagePrepUserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "referenceKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "actionPath" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriagePrepUserNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MarriagePrepUserNotification_user_kind_ref_key"
ON "MarriagePrepUserNotification" ("userId", "kind", "referenceKey");

CREATE INDEX IF NOT EXISTS "MarriagePrepUserNotification_user_read_created_idx"
ON "MarriagePrepUserNotification" ("userId", "readAt", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "MarriagePrepUserNotification_journeyId_idx"
ON "MarriagePrepUserNotification" ("journeyId");
