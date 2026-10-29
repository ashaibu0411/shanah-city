#!/usr/bin/env node
/**
 * Ingest original Shanah City synthesized QA instrumental via Blob + authorized catalog JSON.
 * TEST ONLY — tagged staging-qa-test-only; hidden unless STORY_MUSIC_STAGING_QA_LIBRARY=1.
 *
 *   STORY_MUSIC_STAGING_QA_INTERNAL_AUTH="Recorded internal staging test authorization …"
 *   STORY_MUSIC_BLOB_READ_WRITE_TOKEN=...
 *   node scripts/story-music-staging-qa-ingest.mjs [--dry-run]
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { readFileSync } from "fs";
import path from "path";
import { createHash } from "crypto";
import { put } from "@vercel/blob";
import { spawnSync } from "child_process";

const ROOT = process.cwd();
const RIGHTS_PATH = path.join(ROOT, "data", "story-music-rights-records.json");
const CATALOG_PATH = path.join(ROOT, "data", "story-music-authorized-catalog.json");
const WAV_PATH = path.join(ROOT, "test-fixtures", "story-music-poc", "shanah-staging-qa-instrumental.wav");

const TRACK_ID = "qa-staging-shanah-instrumental-v1";

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

loadEnvFile(path.join(ROOT, ".env.staging.local"));
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
  const internalAuth = process.env.STORY_MUSIC_STAGING_QA_INTERNAL_AUTH?.trim();
  if (!dryRun && !internalAuth) {
    console.error("Set STORY_MUSIC_STAGING_QA_INTERNAL_AUTH with internal test authorization text.");
    process.exit(1);
  }

  const bytes = await ensureWav();
  const sha256 = createHash("sha256").update(bytes).digest("hex");

  if (dryRun) {
    console.log(
      JSON.stringify(
        { dryRun: true, trackId: TRACK_ID, wavBytes: bytes.length, sha256, wavPath: WAV_PATH },
        null,
        2,
      ),
    );
    return;
  }

  const token =
    process.env.STORY_MUSIC_BLOB_READ_WRITE_TOKEN?.trim() || process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new Error("STORY_MUSIC_BLOB_READ_WRITE_TOKEN not set");

  const pathname = `story-music/audio/staging-qa/${TRACK_ID}.wav`;
  const storeId = process.env.STORY_MUSIC_BLOB_STORE_ID?.trim();
  await put(pathname, bytes, {
    access: "private",
    contentType: "audio/wav",
    token,
    addRandomSuffix: false,
    ...(storeId ? { storeId } : {}),
  });

  const storageRef = `story-music://blob/${pathname}`;
  const now = new Date().toISOString();
  const rightsId = "smr-staging-qa-instrumental-v1";

  const rightsFile = JSON.parse(await readFile(RIGHTS_PATH, "utf8"));
  const catalogFile = JSON.parse(await readFile(CATALOG_PATH, "utf8"));

  rightsFile.records = rightsFile.records.filter((r) => r.catalogTrackId !== TRACK_ID);
  rightsFile.records.push({
    id: rightsId,
    status: "published",
    artist: "Shanah City QA",
    title: "Staging QA Instrumental (TEST ONLY)",
    recordingOwner: "Shanah City — original synthesized test tone",
    compositionPublishing: "Original work — Shanah City engineering (staging QA only)",
    documentReference: internalAuth,
    authorizedUses: "Staging QA: in-app story background audio pipeline verification only",
    streamingPermitted: true,
    storagePermitted: true,
    territory: "Staging environments only — not for production member release",
    catalogTrackId: TRACK_ID,
    audioPath: storageRef,
    genres: ["worship"],
    tags: ["staging-qa-test-only"],
    createdAt: now,
    updatedAt: now,
    verifiedAt: now,
    publishedAt: now,
    notes: "TEST ONLY. Excluded from production unless STORY_MUSIC_STAGING_QA_LIBRARY=1 (never in prod).",
  });

  catalogFile.tracks = catalogFile.tracks.filter((t) => t.id !== TRACK_ID);
  catalogFile.tracks.push({
    id: TRACK_ID,
    title: "Staging QA Instrumental (TEST ONLY)",
    artist: "Shanah City QA",
    providerTrackId: `${TRACK_ID}.wav`,
    audioPath: storageRef,
    genres: ["worship"],
    tags: ["staging-qa-test-only"],
    rightsRecordId: rightsId,
    status: "active",
    licenseType: "internal-staging-qa",
    licenseUrl: "",
    attributionText: "Shanah City QA test audio — not a commercial recording.",
    sourceUrl: "",
  });

  await writeFile(RIGHTS_PATH, `${JSON.stringify(rightsFile, null, 2)}\n`);
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalogFile, null, 2)}\n`);

  console.log(
    JSON.stringify({ ok: true, trackId: TRACK_ID, storageRef, sha256, bytes: bytes.length }, null, 2),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
