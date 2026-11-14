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

// A completed Friday broadcast may have been scheduled earlier; its verified
// actualEndTime should compete against uploaded sermons, not its schedule date.
const thursday = v("eee55555555", "Thursday message", "2026-11-12T23:00:00.000Z");
const fridayLiveArchive = v("fff66666666", "Friday Glory Encounter", "2026-11-14T03:15:00.000Z");
const recordedOlder = v("ggg77777777", "Earlier Sunday Message", "2026-11-08T19:00:00.000Z");
assert.equal(pickLatestEligibleSermon([recordedOlder, fridayLiveArchive, thursday])?.id, fridayLiveArchive.id);
assert.equal(mergeHomeSermonVideo(null, [recordedOlder, fridayLiveArchive])?.id, fridayLiveArchive.id);

// A future publication must supersede the previous recording, while a later
// arrival of an older API result must never regress the selected sermon.
const sundayNew = v("hhh88888888", "Sunday Service", "2026-11-15T19:00:00.000Z");
assert.equal(pickLatestEligibleSermon([fridayLiveArchive, sundayNew])?.id, sundayNew.id);
assert.equal(pickLatestEligibleSermon([sundayNew, recordedOlder])?.id, sundayNew.id);
assert.equal(pickLatestEligibleSermon([v("iii99999999", "Service trailer", "2026-11-16T00:00:00.000Z"), fridayLiveArchive])?.id, fridayLiveArchive.id);

// Static guard: the home card must not skip refresh merely because it has an ID.
const homeCard = readFileSync(
  path.join(process.cwd(), "src/components/home/premium/v4/PremiumHomeV4LatestSermon.tsx"), "utf8",
);
assert.doesNotMatch(homeCard, /if\s*\(resolved\?\.id\)\s*return/);
assert.match(homeCard, /visibilitychange/);
assert.match(homeCard, /setInterval/);

// Check the expensive completed-livestream lookup remains quota-cached.
const server = readFileSync(path.join(process.cwd(), "src/lib/youtube-sermons-server.ts"), "utf8");
assert.match(server, /eventType", "completed"/);
assert.match(server, /actualEndTime/);
assert.match(server, /privacyStatus !== "public"/);
assert.match(server, /unstable_cache/);

console.log("youtube-sermons-select.test.ts OK");