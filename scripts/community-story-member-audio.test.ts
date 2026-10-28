import assert from "node:assert/strict";
import { isAllowedCommunityMediaUrl } from "../src/lib/community-media-shared";
import { COMMUNITY_STORY_OVERLAY_AUDIO_MAX_SEC } from "../src/lib/community-media-shared";

assert.equal(COMMUNITY_STORY_OVERLAY_AUDIO_MAX_SEC, 20);
assert.equal(
  isAllowedCommunityMediaUrl("https://example.public.blob.vercel-storage.com/community/audio/x.webm"),
  true,
);
assert.equal(isAllowedCommunityMediaUrl("/uploads/community/audio/x.webm"), true);
assert.equal(isAllowedCommunityMediaUrl("https://evil.com/x.webm"), false);

console.log("community-story-member-audio.test.ts OK");
