import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const manifest = JSON.parse(readFileSync("data/story-music-hmg-approved-qc.json", "utf8"));
assert.equal(manifest.tracks.length, 8);
const seen = new Set();
for (const row of manifest.tracks) {
  assert.ok(!seen.has(row.id), row.id);
  seen.add(row.id);
  assert.equal(new URL(row.recordingUrl).origin, "https://www.heartfeltmg.com");
  assert.ok(new URL(row.recordingUrl).pathname.startsWith("/music/"));
  assert.match(row.audioPath, /^story-music\/audio\/free-library\/hmg-[a-z0-9-]+\.mp3$/);
  assert.match(row.sha256, /^[a-f0-9]{64}$/);
  assert.ok(row.bytes >= 1_000_000 && row.bytes <= 25_000_000);
  assert.ok(row.sourcePageUrl.includes("/songs/"));
}
const script = readFileSync("scripts/story-music-hmg-one-time-upload.mjs", "utf8");
assert.ok(script.includes("VERCEL_ENV"));
assert.ok(script.includes("sha !== row.sha256"));
assert.ok(script.includes("bytes.length !== row.bytes"));
assert.ok(script.includes("process.env.BLOB_READ_WRITE_TOKEN"));
console.log("story-music-hmg-upload-manifest.test.mjs OK");
