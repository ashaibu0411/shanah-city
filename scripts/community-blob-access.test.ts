import assert from "node:assert/strict";
import {
  communityMediaStreamPath,
  isAllowedCommunityStreamPathname,
  isPrivateStorePublicAccessError,
  normalizeCommunityUploadedMediaUrl,
  parseCommunityMediaStreamPathname,
} from "../src/lib/community-blob";
import { isAllowedCommunityMediaUrl } from "../src/lib/community-media-shared";

assert.equal(isPrivateStorePublicAccessError(new Error("Cannot use public access on a private store")), true);

assert.equal(isAllowedCommunityStreamPathname("community/audio/x.wav"), true);
assert.equal(isAllowedCommunityStreamPathname("story-music/audio/x.wav"), false);

const streamUrl = communityMediaStreamPath("community/audio/123-voice.webm");
assert.equal(isAllowedCommunityMediaUrl(streamUrl), true);
assert.equal(parseCommunityMediaStreamPathname(streamUrl), "community/audio/123-voice.webm");

assert.equal(
  normalizeCommunityUploadedMediaUrl(
    "community/audio/a.webm",
    "https://xyz.private.blob.vercel-storage.com/a",
    "private",
  ),
  communityMediaStreamPath("community/audio/a.webm"),
);

console.log("community-blob-access.test.ts OK");
