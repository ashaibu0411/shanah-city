CREATE TABLE IF NOT EXISTS "CommunityStatusReaction" (
    "id" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityStatusReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CommunityStatusReaction_statusId_userId_kind_key"
    ON "CommunityStatusReaction"("statusId", "userId", "kind");

CREATE INDEX IF NOT EXISTS "CommunityStatusReaction_statusId_idx"
    ON "CommunityStatusReaction"("statusId");
