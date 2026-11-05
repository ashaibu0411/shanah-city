import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  COMMUNITY_STORY_OVERLAY_AUDIO_MAX_SEC,
  COMMUNITY_STORY_OVERLAY_AUDIO_MIN_SEC,
} from "../src/lib/community-media-shared";
import { validateStoryVoiceRecording } from "../src/lib/community-story-voice-recording";
import { storyProgressDurationMs } from "../src/lib/community-story-playback";

assert.equal(COMMUNITY_STORY_OVERLAY_AUDIO_MAX_SEC, 60);
assert.equal(COMMUNITY_STORY_OVERLAY_AUDIO_MIN_SEC, 0.5);

assert.equal(
  validateStoryVoiceRecording({ sizeBytes: 8000, durationSec: 18 }).ok,
  true,
);
assert.equal(validateStoryVoiceRecording({ sizeBytes: 50, durationSec: 18 }).ok, false);
assert.equal(validateStoryVoiceRecording({ sizeBytes: 8000, durationSec: 0.2 }).ok, false);
assert.equal(validateStoryVoiceRecording({ sizeBytes: 8000, durationSec: 61 }).ok, false);
assert.equal(
  validateStoryVoiceRecording({ sizeBytes: 400, durationSec: null }).ok,
  false,
  "small blob without metadata",
);
assert.equal(validateStoryVoiceRecording({ sizeBytes: 4096, durationSec: null }).ok, true);

assert.equal(
  storyProgressDurationMs({
    mediaType: "image",
    hasMusic: false,
    hasMemberOverlay: true,
    memberAudioDurationMs: 45_000,
  }),
  45_000,
);
assert.equal(
  storyProgressDurationMs({
    mediaType: "image",
    hasMusic: false,
    hasMemberOverlay: true,
    memberAudioDurationMs: 120_000,
  }),
  60_000,
);

const viewerSource = readFileSync(
  path.join(process.cwd(), "src/components/community/CommunityStoryViewer.tsx"),
  "utf8",
);
assert.match(viewerSource, /creditPlacement="belowMedia"/);
assert.doesNotMatch(
  viewerSource,
  /slide\.music\?\.trackId[\s\S]{0,120}community-story-viewer-media/,
);

const musicAttachSource = readFileSync(
  path.join(process.cwd(), "src/components/community/CommunityStoryMusicAttach.tsx"),
  "utf8",
);
assert.match(musicAttachSource, /community-story-viewer-music-credit-bar/);

console.log("community-story-voice-and-music-layout.test.ts OK");
