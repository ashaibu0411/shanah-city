ALTER TABLE "CommunityStatus" ADD COLUMN IF NOT EXISTS "groupId" TEXT;
ALTER TABLE "CommunityStatus" ADD COLUMN IF NOT EXISTS "postedByUserId" TEXT;
ALTER TABLE "CommunityStatus" ADD COLUMN IF NOT EXISTS "musicTrackId" TEXT;
ALTER TABLE "CommunityStatus" ADD COLUMN IF NOT EXISTS "musicTitle" TEXT;
ALTER TABLE "CommunityStatus" ADD COLUMN IF NOT EXISTS "musicArtist" TEXT;
ALTER TABLE "CommunityStatus" ADD COLUMN IF NOT EXISTS "musicYoutubeVideoId" TEXT;

CREATE INDEX IF NOT EXISTS "CommunityStatus_groupId_idx" ON "CommunityStatus"("groupId");
