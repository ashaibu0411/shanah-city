import assert from "node:assert/strict";
import {
  filterEligibleSermonVideos,
  pickLatestEligibleSermon,
  sortSermonsNewestFirst,
} from "../src/lib/youtube-sermons-select";
import type { SermonVideo } from "../src/lib/youtube-sermons-shared";
import { mergeHomeSermonVideo } from "../src/lib/home-sermon-display";
import { readFileSync } from "node:fs";
import path from "node:path";

function v(id: string, title: string, publishedAt: string): SermonVideo {
  return {
    id,
    title,
    publishedAt,
    watchUrl: `https://www.youtube.com/watch?v=${id}`,
    thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
  };
}

const newer = v("aaa11111111", "November Service", "2026-11-13T18:00:00.000Z");
const older = v("bbb22222222", "October Service", "2026-10-05T12:00:00.000Z");
const short = v("ccc33333333", "#shorts clip", "2026-11-14T10:00:00.000Z");
const undated = v("ddd44444444", "Scraped only", "");

assert.equal(pickLatestEligibleSermon([older, newer])?.id, newer.id);
assert.equal(pickLatestEligibleSermon([short, older])?.id, older.id);
assert.equal(pickLatestEligibleSermon([undated, older])?.id, older.id);
assert.equal(sortSermonsNewestFirst([older, newer])[0]?.id, newer.id);

const page = readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
assert.match(page, /mergeHomeSermonVideo\(null,\s*sermonVideos\)/);

const merged = mergeHomeSermonVideo(null, [older, newer]);
assert.equal(merged?.id, newer.id);
assert.equal(merged?.title, newer.title);

const fallbackOnly = filterEligibleSermonVideos([short]);
assert.equal(fallbackOnly.length, 0);

console.log("youtube-sermons-select.test.ts OK");