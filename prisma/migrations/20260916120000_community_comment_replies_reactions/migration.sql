-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "parentId" TEXT;

-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateTable
CREATE TABLE "CommunityCommentReaction" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityCommentReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityCommentReaction_commentId_idx" ON "CommunityCommentReaction"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityCommentReaction_commentId_userId_kind_key" ON "CommunityCommentReaction"("commentId", "userId", "kind");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityCommentReaction" ADD CONSTRAINT "CommunityCommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
