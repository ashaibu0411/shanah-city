import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  adjustStoryMusicClipStartForDurationChange,
  clipStartFromTimelineRatio,
  clipWindowLeftPx,
  clampStoryMusicClipStartForTrack,
  computeDragGrabOffsetPx,
  maxStoryMusicClipStart,
  normalizeStoryMusicClipDuration,
  normalizeStoryMusicClipStart,
  pointerDragToClipStart,
  pointerXToClipStart,
  storyMusicClipDurationSelectable,
  storyMusicClipEnd,
  storyMusicClipFitsInsideTrack,
  storyMusicClipPlaybackDurationSec,
  storyMusicClipPlaybackEndSeconds,
  storyMusicClipPublishable,
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
assert.equal(
  storySlideDurationMs({ mediaType: "image", music: { clipDurationSec: 30 } }, null, 22_000),
  22000,
);
assert.equal(storyMusicClipPlaybackEndSeconds(0, 30, 25), 25);
assert.equal(storyMusicClipPlaybackEndSeconds(10, 30, 180), 40);
assert.equal(storyMusicClipPlaybackDurationSec(5, 30, 25), 20);
assert.equal(storyMusicClipPlaybackDurationSec(0, 30, 25), 25);
assert.equal(storyMusicClipDurationSelectable(60, 45), false);
assert.equal(storyMusicClipDurationSelectable(30, 25), true);
assert.equal(storyMusicClipDurationSelectable(30, 30), true);
assert.equal(storyMusicClipPublishable(0, 30, 25), true);
assert.equal(storyMusicClipPublishable(22, 30, 25), false);
assert.equal(storySlideDurationMs({ mediaType: "image", music: {} }), STORY_IMAGE_WITH_MUSIC_MS);
assert.equal(storySlideDurationMs({ mediaType: "image" }), 5000);

assert.equal(maxStoryMusicClipStart(180, 30), 150);
assert.equal(maxStoryMusicClipStart(45, 60), 0);
assert.equal(clampStoryMusicClipStartForTrack(200, 30, 180), 150);
assert.equal(adjustStoryMusicClipStartForDurationChange(140, 60, 180), 120);
assert.equal(clipStartFromTimelineRatio(0.5, 200, 30), 85);
const dragStart = pointerXToClipStart(161, 100, 200, 180, 30);
assert.ok(dragStart >= 39 && dragStart <= 41, `drag maps to ~40s start, got ${dragStart}`);

const trackLeft = 100;
const trackWidth = 200;
const trackDuration = 180;
const clipDur: 30 | 60 = 30;
const startAt = 40;
const fingerX = trackLeft + clipWindowLeftPx(startAt, trackWidth, trackDuration, clipDur) + 12;
const grab = computeDragGrabOffsetPx(fingerX, trackLeft, trackWidth, startAt, trackDuration, clipDur);
assert.equal(
  pointerDragToClipStart(fingerX, trackLeft, trackWidth, grab, trackDuration, clipDur),
  startAt,
  "drag preserves grab offset at pointer down",
);
assert.equal(clampStoryMusicClipStartForTrack(50, 30, 25), 0);
assert.equal(storyMusicClipFitsInsideTrack(0, 30, 25), false, "30s label cannot fully fit inside a 25s song");
assert.equal(storyMusicClipFitsInsideTrack(0, 30, 180), true);
assert.equal(storyMusicClipFitsInsideTrack(150, 30, 180), true);
assert.equal(clampStoryMusicClipStartForTrack(151, 30, 180), 150);
assert.equal(storyMusicClipEnd(150, 30), 180);

const timelineSource = readFileSync(
  path.join(process.cwd(), "src/components/community/StoryMusicClipTimeline.tsx"),
  "utf8",
);
assert.match(timelineSource, /pointerDragToClipStart/);
assert.match(timelineSource, /computeDragGrabOffsetPx/);
assert.match(timelineSource, /role="slider"/);
assert.match(timelineSource, /onBlur=\{\(\) => \{\s*commitFallbackDraft/);
assert.doesNotMatch(
  timelineSource,
  /}, \[trackId, catalogDefaultStart, clipDurationSec\]\)/,
  "duration probe should not refetch when clip length changes",
);
assert.doesNotMatch(
  timelineSource,
  /addEventListener\("pointermove"/,
  "avoid duplicate window pointermove handler",
);

const pickerSource = readFileSync(
  path.join(process.cwd(), "src/components/community/CommunityStoryMusicPicker.tsx"),
  "utf8",
);
assert.match(pickerSource, /StoryMusicClipTimeline/);
assert.match(pickerSource, /storyMusicClipDurationSelectable/);
assert.doesNotMatch(pickerSource, /Start at[\s\S]{0,80}type="number"/);

const attachSource = readFileSync(
  path.join(process.cwd(), "src/components/community/CommunityStoryMusicAttach.tsx"),
  "utf8",
);
assert.match(attachSource, /storyMusicClipPlaybackEndSeconds/);
assert.match(attachSource, /onPlaybackDurationKnown/);

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
