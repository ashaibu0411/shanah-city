import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  adjustStoryMusicClipStartForDurationChange,
  clipStartFromTimelineRatio,
  clampStoryMusicClipStartForTrack,
  maxStoryMusicClipStart,
  normalizeStoryMusicClipDuration,
  normalizeStoryMusicClipStart,
  pointerXToClipStart,
  storyMusicClipEnd,
} from "../src/lib/story-music/story-music-clip";
import { storySlideDurationMs, STORY_IMAGE_WITH_MUSIC_MS } from "../src/lib/community-story-utils";

assert.equal(normalizeStoryMusicClipDuration(undefined), 30);
assert.equal(normalizeStoryMusicClipDuration("60"), 60);
assert.equal(normalizeStoryMusicClipDuration(60), 60);
assert.equal(normalizeStoryMusicClipDuration(180), 30);
assert.equal(normalizeStoryMusicClipStart("42.9"), 42);
assert.equal(normalizeStoryMusicClipStart(-10, 17), 17);
assert.equal(normalizeStoryMusicClipStart("bad", 12), 12);
assert.equal(normalizeStoryMusicClipStart(999999), 3600);
assert.equal(storyMusicClipEnd(45, 30), 75);
assert.equal(storyMusicClipEnd(45, 60), 105);
assert.equal(storySlideDurationMs({ mediaType: "image", music: { clipDurationSec: 30 } }), 30000);
assert.equal(storySlideDurationMs({ mediaType: "text", music: { clipDurationSec: 60 } }), 60000);
assert.equal(storySlideDurationMs({ mediaType: "image", music: {} }), STORY_IMAGE_WITH_MUSIC_MS);
assert.equal(storySlideDurationMs({ mediaType: "image" }), 5000);

assert.equal(maxStoryMusicClipStart(180, 30), 150);
assert.equal(maxStoryMusicClipStart(45, 60), 0);
assert.equal(clampStoryMusicClipStartForTrack(200, 30, 180), 150);
assert.equal(adjustStoryMusicClipStartForDurationChange(140, 60, 180), 120);
assert.equal(clipStartFromTimelineRatio(0.5, 200, 30), 85);
const dragStart = pointerXToClipStart(161, 100, 200, 180, 30);
assert.ok(dragStart >= 39 && dragStart <= 41, `drag maps to ~40s start, got ${dragStart}`);

const timelineSource = readFileSync(
  path.join(process.cwd(), "src/components/community/StoryMusicClipTimeline.tsx"),
  "utf8",
);
assert.match(timelineSource, /pointerXToClipStart/);
assert.match(timelineSource, /aria-valuenow/);

const pickerSource = readFileSync(
  path.join(process.cwd(), "src/components/community/CommunityStoryMusicPicker.tsx"),
  "utf8",
);
assert.match(pickerSource, /StoryMusicClipTimeline/);
assert.doesNotMatch(pickerSource, /Start at[\s\S]{0,80}type="number"/);

const statusesRoute = readFileSync(
  path.join(process.cwd(), "src/app/api/community/statuses/route.ts"),
  "utf8",
);
assert.match(
  statusesRoute,
  /clipDurationSec: normalizeStoryMusicClipDuration\(musicClipDurationSec\)/,
  "persist clip timing whenever an attachable licensed track is selected",
);

console.log("story-music-clip.test.ts OK");
