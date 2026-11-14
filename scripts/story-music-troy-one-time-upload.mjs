#!/usr/bin/env node
/**
 * One-time, production-only, fail-closed upload of nine source-verified
 * contemporary Christian recordings. Must be removed from the build hook
 * after the first successful production release.
 *
 * Source license: per-track CC BY 4.0 at Free Music Archive.
 * Rights metadata and SHA256 are pinned in the committed QA manifest.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { put } from "@vercel/blob";

const manifest = JSON.parse(
  await readFile(new URL("../data/story-music-troy-track-specific-qa.json", import.meta.url), "utf8"),
);
const PREFIX = "story-music/audio/free-library/";

function assertTrack(track) {
  const u = new URL(track.sourceAudioUrl);
  if (
    u.protocol !== "https:" ||
    u.hostname !== "files.freemusicarchive.org" ||
    !/^\/storage-freemusicarchive-org\/tracks\/[A-Za-z0-9]+\.mp3$/.test(u.pathname) ||
    u.search ||
    u.hash
  ) throw new Error(`Unexpected audio source for ${track.catalogTrackId}`);
  if (!/^troy-sustarsic-[a-z0-9-]+$/.test(track.catalogTrackId)) {
    throw new Error("Unapproved track ID");
  }
  if (!/^https:\/\/freemusicarchive\.org\/music\/troy-sustarsic\/lord-youre-amazing\//.test(track.trackUrl)) {
    throw new Error("Unexpected license evidence URL");
  }
  if (!/^[0-9a-f]{64}$/.test(track.sha256) || track.size < 1_000_000 ||
      track.duration < 60 || track.bitrate < 192_000) {
    throw new Error("Audio has no verified manifest metadata");
  }
}

async function uploadTrack(track, token) {
  assertTrack(track);
  const res = await fetch(track.sourceAudioUrl, {
    redirect: "error",
    signal: AbortSignal.timeout(120_000),
    headers: { "User-Agent": "ShanahCityStoryMusic/1.0 (CC-BY-approved-audio)" },
  });
  if (!res.ok || !(res.headers.get("content-type") || "").toLowerCase().startsWith("audio/")) {
    throw new Error(`Invalid source response for ${track.catalogTrackId}: ${res.status}`);
  }
  const audio = Buffer.from(await res.arrayBuffer());
  const sha = createHash("sha256").update(audio).digest("hex");
  if (audio.length !== track.size || sha !== track.sha256 ||
      !(audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0)) {
    throw new Error(`Source audio hash, length or MP3 framing mismatch: ${track.catalogTrackId}`);
  }
  const pathname = `${PREFIX}${track.catalogTrackId}.mp3`;
  let access = "public";
  try {
    await put(pathname, audio, { access, token, contentType: "audio/mpeg", addRandomSuffix: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/already exists|pathname is already taken|already uploaded/i.test(message)) {
      console.log(`Audio already in Blob: ${track.catalogTrackId}`);
      return;
    }
    if (!/cannot use public access on a private store/i.test(message)) throw error;
    access = "private";
    await put(pathname, audio, { access, token, contentType: "audio/mpeg", addRandomSuffix: false });
  }
  console.log(`Uploaded ${track.catalogTrackId}: ${audio.length} bytes, sha256=${sha}, access=${access}`);
}

async function main() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log("Troy contemporary Christian audio import: skipped outside production.");
    return;
  }
  if (manifest.tracks.length !== 9 || manifest.sourceLicense !== "CC BY 4.0") {
    throw new Error("Expected exactly nine individually verified CC BY 4.0 source tracks.");
  }
  const token = process.env.STORY_MUSIC_BLOB_READ_WRITE_TOKEN?.trim() ||
    process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new Error("Story music Blob token missing; release blocked to prevent broken audio.");
  for (const track of manifest.tracks) await uploadTrack(track, token);
  console.log("Modern Christian music upload: 9/9 recorded or already present in Blob.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
