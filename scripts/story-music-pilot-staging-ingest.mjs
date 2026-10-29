#!/usr/bin/env node
/**
 * Staging three-song pilot: download cleared tracks, upload to story-music Blob, write intake + catalog JSON.
 * Requires curator attestation — not automatic Shanah City legal approval.
 *
 *   STORY_MUSIC_ADMIN_WRITE_ENABLED=1
 *   STORY_MUSIC_BLOB_READ_WRITE_TOKEN=...
 *   STORY_MUSIC_PILOT_CURATOR_NAME="Name"
 *   STORY_MUSIC_PILOT_CURATOR_ATTESTATION="I confirm rights review for staging pilot"
 *   node scripts/story-music-pilot-staging-ingest.mjs [--dry-run]
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { readFileSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { createHash } from "crypto";
import { put } from "@vercel/blob";

const ROOT = process.cwd();

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
    /* optional local env */
  }
}

loadEnvFile(path.join(ROOT, ".env.staging.local"));
loadEnvFile(path.join(ROOT, ".env.local"));
const PILOT_PATH = path.join(ROOT, "data", "story-music-pilot-three-song.json");
const DISCOVERY_PATH = path.join(ROOT, "data", "story-music-discovery-candidates.json");
const RIGHTS_PATH = path.join(ROOT, "data", "story-music-rights-records.json");
const CATALOG_PATH = path.join(ROOT, "data", "story-music-authorized-catalog.json");

const dryRun = process.argv.includes("--dry-run");

function requireEnv(name) {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function ffmpegAvailable() {
  return spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).status === 0;
}

async function download(url) {
  const res = await fetch(url, { headers: { "User-Agent": "ShanahCityStoryMusicPilot/1.0" } });
  if (!res.ok) throw new Error(`Download failed ${url} HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function transcodeToMp3(inputPath, outputPath) {
  const ff = spawnSync(
    "ffmpeg",
    ["-y", "-i", inputPath, "-codec:a", "libmp3lame", "-qscale:a", "2", outputPath],
    { encoding: "utf8" },
  );
  if (ff.status !== 0) throw new Error(ff.stderr || "ffmpeg failed");
  return readFile(outputPath);
}

async function uploadAudio(bytes, filename, contentType) {
  const token =
    process.env.STORY_MUSIC_BLOB_READ_WRITE_TOKEN?.trim() || process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new Error("STORY_MUSIC_BLOB_READ_WRITE_TOKEN not set");
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
  const pathname = `story-music/audio/free-library/pilot-${Date.now()}-${safeName}`;
  const storeId = process.env.STORY_MUSIC_BLOB_STORE_ID?.trim();
  await put(pathname, bytes, {
    access: "private",
    contentType,
    token,
    addRandomSuffix: false,
    ...(storeId ? { storeId } : {}),
  });
  return { pathname, storageRef: `story-music://blob/${pathname}` };
}

async function main() {
  const pilot = JSON.parse(await readFile(PILOT_PATH, "utf8"));
  const curatorName = process.env.STORY_MUSIC_PILOT_CURATOR_NAME?.trim();
  const attestation = process.env.STORY_MUSIC_PILOT_CURATOR_ATTESTATION?.trim();

  if (!dryRun && (!curatorName || !attestation)) {
    console.error(
      "Curator attestation required: STORY_MUSIC_PILOT_CURATOR_NAME and STORY_MUSIC_PILOT_CURATOR_ATTESTATION",
    );
    process.exit(1);
  }

  if (!dryRun) requireEnv("STORY_MUSIC_ADMIN_WRITE_ENABLED");

  const tmpDir = path.join(ROOT, ".tmp-story-music-pilot-ingest");
  await mkdir(tmpDir, { recursive: true });

  const results = [];
  for (const track of pilot.tracks) {
    if (track.eligibilityReview !== "pass_pending_curator_signoff") {
      results.push({ catalogTrackId: track.catalogTrackId, skipped: true, reason: track.eligibilityReview });
      continue;
    }

    let bytes;
    let contentType = "audio/mpeg";
    let outName = `${track.catalogTrackId}.mp3`;

    if (dryRun) {
      results.push({
        catalogTrackId: track.catalogTrackId,
        dryRun: true,
        downloadUrl: track.downloadUrl,
        transcode: track.transcode,
      });
      continue;
    }

    const raw = await download(track.downloadUrl);
    const ext = path.extname(new URL(track.downloadUrl).pathname).toLowerCase();
    const rawPath = path.join(tmpDir, `${track.catalogTrackId}${ext}`);
    await writeFile(rawPath, raw);

    if ((track.transcode || /\.(ogg|oga|opus|wav|flac)$/i.test(ext)) && ffmpegAvailable()) {
      const mp3Path = path.join(tmpDir, outName);
      bytes = await transcodeToMp3(rawPath, mp3Path);
      contentType = "audio/mpeg";
    } else {
      bytes = raw;
      outName = `${track.catalogTrackId}${ext}`;
      if (ext === ".mp3") contentType = "audio/mpeg";
      else if (/\.(ogg|oga)$/i.test(ext)) contentType = "audio/ogg";
      else if (/\.opus$/i.test(ext)) contentType = "audio/opus";
      else contentType = "application/octet-stream";
    }

    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const { storageRef } = await uploadAudio(bytes, outName, contentType);
    const now = new Date().toISOString();
    const rightsId = `smr-pilot-${track.catalogTrackId}`;

    results.push({
      catalogTrackId: track.catalogTrackId,
      storageRef,
      sha256,
      bytes: bytes.length,
      rightsId,
      curatorName,
      attestationAt: now,
    });
  }

  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, results }, null, 2));
    return;
  }

  const rightsFile = JSON.parse(await readFile(RIGHTS_PATH, "utf8"));
  const catalogFile = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
  const discoveryFile = JSON.parse(await readFile(DISCOVERY_PATH, "utf8"));

  for (const r of results.filter((x) => x.storageRef)) {
    const track = pilot.tracks.find((t) => t.catalogTrackId === r.catalogTrackId);
    const now = r.attestationAt;
    rightsFile.records = rightsFile.records.filter((rec) => rec.catalogTrackId !== r.catalogTrackId);
    rightsFile.records.push({
      id: r.rightsId,
      status: "published",
      artist: track.artist,
      title: track.title,
      recordingOwner: track.recordingNote,
      compositionPublishing: track.compositionNote,
      documentReference: track.rightsEvidenceRef,
      authorizedUses: "In-app user-generated story background audio (Shanah City Stories)",
      streamingPermitted: true,
      storagePermitted: true,
      territory: track.territory,
      catalogTrackId: r.catalogTrackId,
      audioPath: r.storageRef,
      genres: [track.category],
      tags: ["free-worship-pilot"],
      createdAt: now,
      updatedAt: now,
      verifiedAt: now,
      publishedAt: now,
      notes: `Staging pilot ingest. Curator: ${curatorName}. Attestation: ${attestation.slice(0, 200)}`,
    });

    catalogFile.tracks = catalogFile.tracks.filter((t) => t.id !== r.catalogTrackId);
    catalogFile.tracks.push({
      id: r.catalogTrackId,
      title: track.title,
      artist: track.artist,
      providerTrackId: path.basename(r.storageRef),
      audioPath: r.storageRef,
      genres: [track.category],
      tags: ["free-worship-pilot"],
      rightsRecordId: r.rightsId,
      status: "active",
      licenseType: track.licenseShort,
      licenseUrl: track.licenseUrl,
      attributionText: track.attributionText,
      sourceUrl: track.sourcePageUrl,
    });

    const cand = discoveryFile.candidates.find((c) => c.id === track.discoveryId);
    if (cand) {
      cand.reviewStatus = "published";
      cand.updatedAt = now;
      cand.approvedAt = now;
      cand.rightsEvidenceRef = track.rightsEvidenceRef;
      cand.recordingRightsNote = track.recordingNote;
      cand.compositionRightsNote = track.compositionNote;
      cand.attributionStatement = track.attributionText;
      cand.pilotCurator = curatorName;
      cand.pilotAttestationAt = now;
    }
  }

  await writeFile(RIGHTS_PATH, `${JSON.stringify(rightsFile, null, 2)}\n`);
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalogFile, null, 2)}\n`);
  await writeFile(DISCOVERY_PATH, `${JSON.stringify(discoveryFile, null, 2)}\n`);

  console.log(JSON.stringify({ ok: true, ingested: results.filter((x) => x.storageRef).length, results }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
