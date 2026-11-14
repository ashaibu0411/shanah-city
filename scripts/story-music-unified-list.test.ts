import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const picker = readFileSync("src/components/community/CommunityStoryMusicPicker.tsx", "utf8");
const api = readFileSync("src/app/api/community/story-music/route.ts", "utf8");
const css = readFileSync("src/app/globals.css", "utf8");
const catalog = JSON.parse(readFileSync("data/story-music-authorized-catalog.json", "utf8"));

assert.match(picker, /<h3 className="story-music-discovery-title">All songs<\/h3>/);
assert.match(picker, /pickerCategory: "all"/);
assert.match(picker, /country: "all"/);
assert.match(picker, /language: "all"/);
assert.match(picker, /tracks\.map\(\(track\) =>/);
assert.match(picker, /<StoryMusicPreviewPlayer trackId=\{track\.id\}/);
assert.match(picker, /<StoryMusicClipTimeline/);
assert.match(picker, /onClick=\{\(\) => \{\s*onSelect\(track\)/);
assert.doesNotMatch(picker, /STORY_MUSIC_PICKER_CATEGORIES|setPickerCategory|story-music-category-scroll|showRegions|setRegion|setCountry|setLanguage/);
assert.match(css, /\.story-music-track-list \{ max-height: min\(68dvh, 38rem\)/);
assert.match(api, /limit: 200/);
assert.ok(catalog.tracks.some((x: { id: string }) => x.id === "audiodollar-gospel"));
assert.ok(catalog.tracks.some((x: { id: string }) => x.id === "troy-sustarsic-ready-for-the-king"));
assert.ok(catalog.tracks.some((x: { id: string }) => x.id === "amazing-grace-usaf-reserve-band"));
console.log("story-music-unified-list.test.ts OK");
