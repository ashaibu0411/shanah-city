import assert from "node:assert/strict";
import {
  COMMUNITY_STORY_OVERLAY_AUDIO_MAX_SEC,
  inferCommunityMediaType,
  isAllowedCommunityMediaUrl,
  isStoryVoiceRecordingFileName,
} from "../src/lib/community-media-shared";

assert.equal(COMMUNITY_STORY_OVERLAY_AUDIO_MAX_SEC, 20);
assert.equal(
  isAllowedCommunityMediaUrl("https://example.public.blob.vercel-storage.com/community/audio/x.webm"),
  true,
);
assert.equal(isAllowedCommunityMediaUrl("/uploads/community/audio/x.webm"), true);
assert.equal(isAllowedCommunityMediaUrl("https://evil.com/x.webm"), false);

assert.equal(isStoryVoiceRecordingFileName("story-recording-1730123456789.webm"), true);

class FakeFile {
  name: string;
  type: string;
  size: number;
  constructor(name: string, type: string, size = 4096) {
    this.name = name;
    this.type = type;
    this.size = size;
  }
}

assert.equal(
  inferCommunityMediaType(new FakeFile("story-recording-1.webm", "video/webm") as File),
  "audio",
);
assert.equal(
  inferCommunityMediaType(new FakeFile("story-recording-1.webm", "audio/webm;codecs=opus") as File),
  "audio",
);
assert.equal(
  inferCommunityMediaType(new FakeFile("clip.webm", "video/webm") as File),
  "video",
);

console.log("community-story-member-audio.test.ts OK");
