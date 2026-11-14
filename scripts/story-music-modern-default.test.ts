import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  matchesStoryMusicPickerCategory,
  isStoryMusicClassic,
} from "../src/lib/story-music/search.ts";

const picker = readFileSync("src/components/community/CommunityStoryMusicPicker.tsx", "utf8");
assert.match(picker, /useState\(\(\) => selectedTrackId \? "all" : "modern_worship"\)/);

const classic = {
  id: "old",
  title: "Amazing Grace",
  artist: "United States Air Force Band",
  provider: "church_authorized" as const,
  providerTrackId: "old",
  playability: "playable" as const,
  genres: ["worship", "hymn"],
  tags: ["hymn", "free-library"],
};
const modern = {
  id: "new",
  title: "In Your Hands",
  artist: "Lee Wastler",
  provider: "church_authorized" as const,
  providerTrackId: "new",
  playability: "playable" as const,
  genres: ["contemporary_christian", "worship"],
  tags: ["verified-vocal"],
};
assert.equal(isStoryMusicClassic(classic), true);
assert.equal(matchesStoryMusicPickerCategory(classic, "modern_worship"), false);
assert.equal(matchesStoryMusicPickerCategory(modern, "modern_worship"), true);
assert.equal(matchesStoryMusicPickerCategory(classic, "traditional_gospel"), true);
console.log("story-music-modern-default.test.ts OK");
