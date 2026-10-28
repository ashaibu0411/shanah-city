import assert from "node:assert/strict";
import { storyProgressDurationMs } from "../src/lib/community-story-playback";
import { storySlideDurationMs, STORY_IMAGE_MS, STORY_IMAGE_WITH_MUSIC_MS } from "../src/lib/community-story-utils";
import { inferCommunityAudioContentType, isCommunityAudioName } from "../src/lib/community-media-shared";
import { communityAudioNameFromUrl } from "../src/lib/community-story-member-audio-playback";
import { getYouTubeStoryVisibleEmbedSrc } from "../src/lib/worship-youtube-timestamp-utils";

assert.equal(
  storyProgressDurationMs({
    mediaType: "image",
    hasMusic: false,
    hasMemberOverlay: true,
    memberAudioDurationMs: 12_000,
  }),
  12_000,
);

assert.equal(
  storyProgressDurationMs({
    mediaType: "image",
    hasMusic: true,
    hasMemberOverlay: false,
  }),
  STORY_IMAGE_WITH_MUSIC_MS,
);

assert.equal(
  storySlideDurationMs({ mediaType: "image", memberStoryAudio: { url: "x" } }, 8_500),
  8500,
);

assert.equal(isCommunityAudioName("voice.webm"), true);
assert.equal(inferCommunityAudioContentType("voice.webm"), "audio/webm");
assert.equal(
  inferCommunityAudioContentType(
    communityAudioNameFromUrl("https://x.public.blob.vercel-storage.com/community/audio/story-recording-1.webm"),
  ),
  "audio/webm",
);

const visibleSrc = getYouTubeStoryVisibleEmbedSrc("abc123", { paused: false, soundOn: true }, 30, "https://app.test");
assert.match(visibleSrc, /controls=1/);
assert.match(visibleSrc, /mute=0/);
assert.match(visibleSrc, /start=30/);
assert.doesNotMatch(visibleSrc, /end=/);

console.log("community-story-playback.test.ts OK");
