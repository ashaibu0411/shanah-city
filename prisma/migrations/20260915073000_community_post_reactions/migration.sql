CREATE TABLE "CommunityPostReaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityPostReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommunityPostReaction_postId_userId_kind_key" ON "CommunityPostReaction"("postId", "userId", "kind");

CREATE INDEX "CommunityPostReaction_postId_idx" ON "CommunityPostReaction"("postId");
