ALTER TABLE "CommunityPost" ADD COLUMN IF NOT EXISTS "mediaItems" JSONB;

UPDATE "CommunityPost"
SET "mediaItems" = jsonb_build_array(
  jsonb_build_object('url', "mediaUrl", 'type', "mediaType")
)
WHERE "mediaUrl" IS NOT NULL
  AND "mediaType" IS NOT NULL
  AND "mediaItems" IS NULL;
