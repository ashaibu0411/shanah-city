import assert from "node:assert/strict";
import test from "node:test";
import {
  matchesStoryMusicPickerCategory,
  matchesStoryMusicSearch,
  isStoryMusicClassic,
  rankStoryMusicForDiscovery,
  STORY_MUSIC_PICKER_CATEGORIES,
} from "../src/lib/story-music/search.ts";
import type { StoryMusicTrackRecord } from "../src/lib/story-music/types.ts";

function track(partial: Partial<StoryMusicTrackRecord> & Pick<StoryMusicTrackRecord, "id" | "title" | "artist">) {
  return {
    provider: "licensed_catalog" as const,
    providerTrackId: partial.id,
    playability: "playable" as const,
    ...partial,
  };
}

test("picker category: instrumentals only", () => {
  const vocal = track({
    id: "v1",
    title: "Amazing Grace",
    artist: "Choir",
    genres: ["gospel", "worship"],
    tags: ["free-library"],
  });
  const inst = track({
    id: "i1",
    title: "Peaceful Piano",
    artist: "QA",
    genres: ["instrumental", "worship"],
    tags: ["instrumental-only"],
  });
  assert.equal(matchesStoryMusicPickerCategory(vocal, "instrumentals"), false);
  assert.equal(matchesStoryMusicPickerCategory(inst, "instrumentals"), true);
});

test("picker category: traditional gospel matches spiritual / hymn signals", () => {
  const fisk = track({
    id: "fisk",
    title: "Swing Low, Sweet Chariot",
    artist: "Fisk Jubilee Singers",
    genres: ["hymn"],
    tags: ["traditional_gospel", "spiritual"],
  });
  assert.equal(matchesStoryMusicPickerCategory(fisk, "traditional_gospel"), true);
  assert.equal(matchesStoryMusicPickerCategory(fisk, "gospel_worship_songs"), false);
});

test("matchesStoryMusicSearch applies pickerCategory filter", () => {
  const rows = [
    track({
      id: "lw",
      title: "In Your Hands",
      artist: "Lee Wastler",
      genres: ["gospel", "contemporary_christian", "worship"],
      tags: ["gospel_worship_songs"],
    }),
    track({
      id: "qa",
      title: "Pilot Test Instrumental",
      artist: "Shanah City QA",
      genres: ["instrumental"],
      tags: ["instrumental-only"],
    }),
  ];
  const worshipOnly = rows.filter((t) =>
    matchesStoryMusicSearch(t, { pickerCategory: "gospel_worship_songs" }),
  );
  assert.equal(worshipOnly.length, 1);
  assert.equal(worshipOnly[0]?.id, "lw");
});

test("modern-first sorting keeps legacy hymns discoverable but out of the lead", () => {
  const oldBand = track({
    id: "old", title: "Battle Hymn of the Republic", artist: "United States Air Force Band",
    genres: ["gospel", "worship", "contemporary_christian"], tags: ["gospel_worship_songs"],
  });
  const modernSinger = track({
    id: "modern", title: "In Your Hands", artist: "Lee Wastler",
    genres: ["contemporary_christian", "worship"], tags: ["verified-vocal"],
  });
  const sorted = rankStoryMusicForDiscovery([oldBand, modernSinger]);
  assert.deepEqual(sorted.map((row) => row.id), ["modern", "old"]);
  assert.equal(isStoryMusicClassic(oldBand), true);
  assert.equal(matchesStoryMusicPickerCategory(oldBand, "modern_worship"), false);
  assert.equal(matchesStoryMusicPickerCategory(oldBand, "traditional_gospel"), true);
  assert.equal(matchesStoryMusicPickerCategory(modernSinger, "modern_worship"), true);
});

test("global, youth and Afrogospel require actual metadata, not made-up inventory", () => {
  const african = track({
    id: "gh", title: "Original Afrogospel", artist: "Independent artist",
    country: "GH", genres: ["gospel", "worship"], tags: ["afrogospel", "upbeat"],
  });
  assert.equal(matchesStoryMusicPickerCategory(african, "afrogospel"), true);
  assert.equal(matchesStoryMusicPickerCategory(african, "global_worship"), true);
  assert.equal(matchesStoryMusicPickerCategory(african, "youth_gospel"), true);
  const classic = track({
    id: "classic", title: "Amazing Grace", artist: "United States Air Force Band",
    genres: ["contemporary_christian", "worship"], tags: ["hymn"],
  });
  assert.equal(matchesStoryMusicPickerCategory(classic, "afrogospel"), false);
  assert.equal(matchesStoryMusicPickerCategory(classic, "youth_gospel"), false);
  assert.equal(STORY_MUSIC_PICKER_CATEGORIES.some((c) => c.id === "traditional_gospel" && c.label === "Gospel classics"), true);
});
