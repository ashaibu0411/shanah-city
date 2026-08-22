-- Community post media
ALTER TABLE "CommunityPost" ADD COLUMN IF NOT EXISTS "authorId" TEXT;
ALTER TABLE "CommunityPost" ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT;
ALTER TABLE "CommunityPost" ADD COLUMN IF NOT EXISTS "mediaType" TEXT;

-- Ephemeral community statuses (stories)
CREATE TABLE IF NOT EXISTS "CommunityStatus" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityStatus_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CommunityStatus_expiresAt_idx" ON "CommunityStatus"("expiresAt");
CREATE INDEX IF NOT EXISTS "CommunityStatus_authorId_idx" ON "CommunityStatus"("authorId");
