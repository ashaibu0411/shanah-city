CREATE TABLE IF NOT EXISTS "CommunityStatusReply" (
    "id" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityStatusReply_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CommunityStatusReply_statusId_idx"
    ON "CommunityStatusReply"("statusId");
