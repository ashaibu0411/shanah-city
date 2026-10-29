import assert from "node:assert/strict";
import {
  buildCcByAttribution,
  evaluateStoryMusicFreeLicense,
} from "../src/lib/story-music/story-music-free-license";

assert.equal(evaluateStoryMusicFreeLicense({ license: "cc0" }).allowed, true);
assert.equal(evaluateStoryMusicFreeLicense({ license: "by", licenseUrl: "https://creativecommons.org/licenses/by/4.0/" }).allowed, true);
assert.equal(
  evaluateStoryMusicFreeLicense({ license: "by-nc", licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/" }).allowed,
  false,
);
assert.equal(
  evaluateStoryMusicFreeLicense({ license: "by-sa", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" }).allowed,
  false,
);

const attr = buildCcByAttribution({
  title: "Worship",
  artist: "Artist",
  sourceUrl: "https://example.org/track",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
});
assert.match(attr, /Worship by Artist/);

console.log("story-music-free-license.test.ts OK");
