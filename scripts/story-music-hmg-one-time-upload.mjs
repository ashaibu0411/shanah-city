#!/usr/bin/env node
/**
 * One-time production audio upload. No catalog publication in this step.
 * Runs only on Vercel production build; every source is SHA256 pinned to
 * independently downloaded and FFmpeg-decoded, CC BY 4.0 HMG recordings.
 * This script and its build hook must be removed after successful ingest.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { put } from "@vercel/blob";

const manifest = JSON.parse(await readFile(new URL("../data/story-music-hmg-approved-qc.json", import.meta.url), "utf8"));

async function main() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log("Heartfelt import: skipped outside production");
    return;
  }
  const token = process.env.STORY_MUSIC_BLOB_READ_WRITE_TOKEN?.trim() ||
    process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new Error("Heartfelt upload blocked: production Blob upload token is not configured.");

  for (const row of manifest.tracks) {
    const u = new URL(row.recordingUrl);
    if (u.protocol !== "https:" || u.hostname !== "www.heartfeltmg.com" || !u.pathname.startsWith("/music/") || !u.pathname.endsWith(".mp3")) {
      throw new Error(`Heartfelt upload blocked: unexpected origin for ${row.id}`);
    }
    const response = await fetch(u, { signal: AbortSignal.timeout(90000), redirect: "error" });
    if (!response.ok || !(response.headers.get("content-type") || "").toLowerCase().includes("audio/mpeg")) {
      throw new Error(`Heartfelt upload blocked: ${row.id} source returned invalid status/content-type ${response.status}`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const sha = createHash("sha256").update(bytes).digest("hex");
    if (bytes.length !== row.bytes || sha !== row.sha256 || bytes.subarray(0, 3).toString("ascii") !== "ID3") {
      throw new Error(`Heartfelt upload blocked: ${row.id} byte count/hash/header mismatch`);
    }
    const pathname = row.audioPath;
    if (!/^story-music\/audio\/free-library\/hmg-[a-z0-9-]+\.mp3$/.test(pathname)) {
      throw new Error(`Heartfelt upload blocked: disallowed path for ${row.id}`);
    }
    let access = "public";
    try {
      await put(pathname, bytes, { access, token, contentType: "audio/mpeg", addRandomSuffix: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/already exists|pathname is already taken|already uploaded/i.test(message)) {
        console.log(`Heartfelt audio already exists: ${row.id}`);
        continue;
      }
      if (!/cannot use public access on a private store/i.test(message)) throw error;
      access = "private";
      await put(pathname, bytes, { access, token, contentType: "audio/mpeg", addRandomSuffix: false });
    }
    console.log(`Heartfelt uploaded: ${row.id} bytes=${bytes.length} sha256=${sha} access=${access}`);
  }
  console.log("Heartfelt import: 8/8 audio blobs uploaded or already present. Catalog remains unchanged.");
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
