import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  STORY_MUSIC_CLIP_TIMELINE_FALLBACK_TRACK_SEC,
  isUsableStoryMusicAudioDuration,
  resolveStoryMusicClipTimelineTrackDuration,
  storyMusicClipTimelineDragMove,
  storyMusicClipTimelineDragStart,
  storyMusicClipTimelineProbeState,
} from "../src/lib/story-music/story-music-clip-timeline";

assert.equal(isUsableStoryMusicAudioDuration(120), true);
assert.equal(isUsableStoryMusicAudioDuration(Number.POSITIVE_INFINITY), false);
assert.equal(isUsableStoryMusicAudioDuration(0), false);

assert.deepEqual(resolveStoryMusicClipTimelineTrackDuration({ measuredSec: 95, hasPlayableAudio: true }), {
  durationSec: 95,
  kind: "measured",
});
assert.deepEqual(
  resolveStoryMusicClipTimelineTrackDuration({ measuredSec: null, hasPlayableAudio: true }),
  { durationSec: STORY_MUSIC_CLIP_TIMELINE_FALLBACK_TRACK_SEC, kind: "estimated" },
);
assert.deepEqual(
  resolveStoryMusicClipTimelineTrackDuration({ measuredSec: null, hasPlayableAudio: false }),
  { durationSec: null, kind: "none" },
);

assert.equal(storyMusicClipTimelineProbeState({ hasPlayableAudio: true, measuredSec: 42, fetchSettled: true }), "measured");
assert.equal(
  storyMusicClipTimelineProbeState({ hasPlayableAudio: true, measuredSec: null, fetchSettled: true }),
  "estimated",
);
assert.equal(
  storyMusicClipTimelineProbeState({ hasPlayableAudio: true, measuredSec: null, fetchSettled: false }),
  "loading",
);

const trackLeft = 0;
const trackWidth = 320;
const trackDuration = 120;
const clipDur = 30 as const;
const startAt = 10;
const grab = storyMusicClipTimelineDragStart(80, trackLeft, trackWidth, startAt, trackDuration, clipDur);
const moved = storyMusicClipTimelineDragMove(200, trackLeft, trackWidth, grab, trackDuration, clipDur);
assert.ok(moved > startAt, "drag to the right increases clip start");

const timelineSource = readFileSync(
  path.join(process.cwd(), "src/components/community/StoryMusicClipTimeline.tsx"),
  "utf8",
);
assert.match(timelineSource, /bindStoryMusicClipTimelineDocumentDrag/);
assert.match(timelineSource, /durationchange/);
assert.match(timelineSource, /hasPlayableAudio/);
assert.doesNotMatch(
  timelineSource,
  /if \(trackDurationSec == null \|\| trackDurationSec <= 0\) return;\s*\n\s*const rect = railRef/,
);

const css = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
assert.match(css, /\.story-music-clip-timeline-rail[\s\S]*touch-action:\s*none/);

console.log("story-music-clip-timeline.test.ts OK");
