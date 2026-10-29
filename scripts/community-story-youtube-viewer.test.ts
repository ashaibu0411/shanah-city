import assert from "node:assert/strict";
import {
  getYouTubeStoryBackgroundEmbedSrc,
  getYouTubeStoryVisibleEmbedSrc,
} from "../src/lib/worship-youtube-timestamp-utils";

const visible = getYouTubeStoryVisibleEmbedSrc("dQw4w9WgXcQ", { paused: false, soundOn: true }, 0, "https://shanah-city.vercel.app");
assert.match(visible, /controls=1/);
assert.match(visible, /youtube-nocookie\.com\/embed/);
assert.doesNotMatch(visible, /disablekb=1/);

const hidden = getYouTubeStoryBackgroundEmbedSrc("dQw4w9WgXcQ", { paused: false, soundOn: true });
assert.match(hidden, /controls=0/);

console.log("community-story-youtube-viewer.test.ts OK");
