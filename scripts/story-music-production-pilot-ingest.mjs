#!/usr/bin/env node
/**
 * Upload production-pilot QA instrumental to Vercel Blob (production store token).
 * Catalog + rights JSON are committed; this script only uploads bytes.
 *
 *   STORY_MUSIC_PRODUCTION_PILOT_INTERNAL_AUTH="Recorded internal production pilot authorization …"
 *   BLOB_READ_WRITE_TOKEN=...   (production project — never commit)
 *   node scripts/story-music-production-pilot-ingest.mjs [--dry-run]
 */

import { readFile } from "fs/promises";
import { readFileSync } from "fs";
import path from "path";
import { createHash } from "crypto";
import { put } from "@vercel/blob";
import { spawnSync } from "child_process";

const ROOT = process.cwd();
const WAV_PATH = path.join(ROOT, "test-fixtures", "story-music-poc", "shanah-staging-qa-instrumental.wav");
const BLOB_PATH = "story-music/audio/production-pilot/qa-production-pilot-instrumental-v1.wav";
const TRACK_ID = "qa-production-pilot-instrumental-v1";

function loadEnvFile(filePath) {
  try {
    const text = readFileSync(filePath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (process.env[key]) continue;
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

loadEnvFile(path.join(ROOT, ".env.local"));

const dryRun = process.argv.includes("--dry-run");

async function ensureWav() {
  try {
    await readFile(WAV_PATH);
  } catch {
    spawnSync(process.execPath, [path.join(ROOT, "scripts", "generate-story-music-poc-audio.mjs")], {
      stdio: "inherit",
    });
  }
  return readFile(WAV_PATH);
}

async function main() {
  const internalAuth = process.env.STORY_MUSIC_PRODUCTION_PILOT_INTERNAL_AUTH?.trim();
  if (!dryRun && !internalAuth) {
    console.error("Set STORY_MUSIC_PRODUCTION_PILOT_INTERNAL_AUTH with internal pilot authorization text.");
    process.exit(1);
  }

  const bytes = await ensureWav();
  const sha256 = createHash("sha256").update(bytes).digest("hex");

  if (dryRun) {
    console.log(
      JSON.stringify({ dryRun: true, trackId: TRACK_ID, blobPath: BLOB_PATH, wavBytes: bytes.length, sha256 }, null, 2),
    );
    return;
  }

  const token = process.env.STORY_MUSIC_BLOB_READ_WRITE_TOKEN?.trim() || process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    console.error("Missing BLOB_READ_WRITE_TOKEN for production Blob upload.");
    process.exit(1);
  }

  const result = await put(BLOB_PATH, bytes, {
    access: "public",
    token,
    contentType: "audio/wav",
    addRandomSuffix: false,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        trackId: TRACK_ID,
        blobPath: BLOB_PATH,
        url: result.url,
        sha256,
        wavBytes: bytes.length,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
