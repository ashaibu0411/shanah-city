import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  normalizeStoryMusicClipDuration,
  normalizeStoryMusicClipStart,
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
