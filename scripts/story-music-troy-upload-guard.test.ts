import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const qa = JSON.parse(readFileSync("data/story-music-troy-track-specific-qa.json", "utf8"));
const catalog = JSON.parse(readFileSync("data/story-music-authorized-catalog.json", "utf8"));
const rights = JSON.parse(readFileSync("data/story-music-rights-records.json", "utf8"));
const uploader = readFileSync("scripts/story-music-troy-one-time-upload.mjs", "utf8");
const build = readFileSync("scripts/build.cjs", "utf8");

assert.equal(qa.tracks.length, 9);
assert.equal(qa.sourceLicense, "CC BY 4.0");
assert.equal(qa.publicationStatus, "PUBLISHED_AND_PRODUCTION_STREAM_VERIFIED");
assert.doesNotMatch(build, /story-music-troy-one-time-upload/);
assert.match(uploader, /VERCEL_ENV !== "production"/);
assert.match(uploader, /sha !== track\.sha256/);
assert.match(uploader, /audio\.length !== track\.size/);
assert.match(uploader, /Blob token missing/);
assert.match(uploader, /sourceAudioUrl/);
const seen = new Set<string>();
for (const t of qa.tracks) {
  assert.ok(!seen.has(t.catalogTrackId));
  seen.add(t.catalogTrackId);
  assert.ok(t.duration > 60 && t.bitrate >= 192000 && t.size > 1_000_000);
  assert.match(t.sha256, /^[0-9a-f]{64}$/);
  assert.equal(t.instrumental, "No (per individual FMA track page)");
  assert.match(t.sourceAudioUrl, /^https:\/\/files\.freemusicarchive\.org\/storage-freemusicarchive-org\/tracks\/[A-Za-z0-9]+\.mp3$/);
  const c = catalog.tracks.find((x: { id: string }) => x.id === t.catalogTrackId);
  const r = rights.records.find((x: { catalogTrackId: string }) => x.catalogTrackId === t.catalogTrackId);
  assert.ok(c, `Missing catalog row for ${t.catalogTrackId}`);
  assert.ok(r, `Missing rights row for ${t.catalogTrackId}`);
  assert.equal(c.audioPath, `story-music://blob/story-music/audio/free-library/${t.catalogTrackId}.mp3`);
  assert.equal(c.licenseType, "CC BY 4.0");
  assert.equal(r.licenseType, "CC BY 4.0");
  assert.equal(r.storagePermitted, true);
  assert.equal(r.streamingPermitted, true);
  assert.ok(c.tags.includes("modern-worship"));
  assert.equal(r.status, "published");
}
console.log("story-music-troy-upload-guard.test.ts OK");
