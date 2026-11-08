#!/usr/bin/env node
/**
 * After human approval: download verified audio and prepare catalog intake fields.
 * Does NOT publish to production catalog without STORY_MUSIC_ADMIN_WRITE_ENABLED.
 *
 * Usage:
 *   node scripts/story-music-ingest-approved.mjs --candidate smd-xxx --dry-run
 *   node scripts/story-music-ingest-approved.mjs --candidate smd-xxx --out-dir ./.tmp-story-music-ingest
 *
 * --upload-blob uploads approved recordings with Vercel Blob credentials;
 * publication remains a separate, audited admin intake action.
 */

import { readFile, mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import { spawnSync } from "child_process";
import { fetchAudioWithRetry } from "./story-music-download-audio.mjs";
import { resolveApprovedStoryMusicAudioUrl } from "./story-music-audio-source-policy.mjs";

const ROOT = process.cwd();
const DISCOVERY_PATH =
  process.env.STORY_MUSIC_DISCOVERY_PATH?.trim() ||
  path.join(ROOT, "data", "story-music-discovery-candidates.json");

function parseArgs(argv) {
  const candidate = argv.find((a) => a.startsWith("--candidate="))?.split("=")[1];
  const dryRun = argv.includes("--dry-run");
  const transcodeMp3 = argv.includes("--transcode-mp3");
  const uploadBlob = argv.includes("--upload-blob");
  const outDir =
    argv.find((a) => a.startsWith("--out-dir="))?.split("=")[1] ??
    path.join(ROOT, ".tmp-story-music-ingest");
  return { candidate, dryRun, transcodeMp3, uploadBlob, outDir };
}

function resolveDirectAudioUrl(row) {
  return resolveApprovedStoryMusicAudioUrl(row.recordingUrl);
}

function ffmpegAvailable() {
  const r = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  return r.status === 0;
}

function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

async function main() {
  const { candidate, dryRun, transcodeMp3, uploadBlob, outDir } = parseArgs(process.argv.slice(2));
  if (!candidate) {
    console.error("Usage: --candidate=smd-... [--dry-run] [--out-dir=path]");
    process.exit(1);
  }

  const file = JSON.parse(await readFile(DISCOVERY_PATH, "utf8"));
  const row = file.candidates.find((c) => c.id === candidate);
  if (!row) {
    console.error("Candidate not found.");
    process.exit(1);
  }
  if (row.reviewStatus !== "approved" && row.reviewStatus !== "published") {
    console.error(`Candidate status is ${row.reviewStatus}; human must approve first.`);
    process.exit(1);
  }
  if (
    !row.rightsEvidenceRef?.trim() ||
    !row.recordingRightsNote?.trim() ||
    !row.compositionRightsNote?.trim() ||
    !row.territory?.trim() ||
    row.streamingPermitted !== true ||
    row.storagePermitted !== true
  ) {
    console.error("Approved candidate requires recorded evidence, composition and recording rights, territory, and explicit streaming/storage permissions.");
    process.exit(1);
  }
  if (uploadBlob && (!process.env.STORY_MUSIC_CURATOR_NAME?.trim() || !process.env.STORY_MUSIC_CURATOR_ATTESTATION?.trim())) {
    console.error("--upload-blob requires curator name and recorded authorization in environment variables.");
    process.exit(1);
  }

  const audioUrl = resolveDirectAudioUrl(row);
  if (!audioUrl) {
    console.error("No direct recording URL on candidate.");
    process.exit(1);
  }

  const catalogTrackId =
    row.catalogTrackId?.trim() || slug(`${row.artist}-${row.title}`) || candidate;
  let ext = path.extname(new URL(audioUrl).pathname) || ".ogg";
  let shouldTranscode =
    transcodeMp3 && !/\.mp3$/i.test(ext) && /\.(ogg|oga|opus|wav|flac)$/i.test(ext);
  if (shouldTranscode && !ffmpegAvailable()) {
    console.warn("--transcode-mp3 requested but ffmpeg not found on PATH; uploading source format.");
    shouldTranscode = false;
  }
  if (shouldTranscode) ext = ".mp3";
  const fileName = `${catalogTrackId}${ext}`;
  const blobPath = `story-music/audio/free-library/${fileName}`;
  const audioPath = `story-music://blob/${blobPath}`;

  const intake = {
    catalogTrackId,
    artist: row.artist,
    title: row.title,
    audioPath,
    documentReference: row.rightsEvidenceRef,
    recordingOwner: row.recordingRightsNote,
    compositionPublishing: row.compositionRightsNote,
    authorizedUses: "In-app user-generated story background audio (Shanah City Stories)",
    streamingPermitted: row.streamingPermitted,
    storagePermitted: row.storagePermitted,
    territory: row.territory,
    licenseType: row.licenseSlug,
    licenseUrl: row.licenseUrl,
    attributionText: row.attributionStatement,
    sourceUrl: row.sourcePageUrl,
    genres: row.genres,
    tags: row.tags,
  };

  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, intake, downloadFrom: audioUrl, uploadBlobRequested: uploadBlob }, null, 2));
    return;
  }

  await mkdir(outDir, { recursive: true });
  const response = await fetchAudioWithRetry(audioUrl, { label: catalogTrackId });
  const declaredType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!declaredType.startsWith("audio/") && !["application/ogg", "application/octet-stream"].includes(declaredType)) {
    throw new Error("Source did not return a supported audio content type.");
  }
  const downloaded = path.join(outDir, `_download${path.extname(new URL(audioUrl).pathname) || ".bin"}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(downloaded, buffer);
  let localPath = path.join(outDir, fileName);
  let finalBuffer = buffer;
  if (shouldTranscode) {
    const ff = spawnSync(
      "ffmpeg",
      ["-y", "-i", downloaded, "-codec:a", "libmp3lame", "-qscale:a", "2", localPath],
      { encoding: "utf8" },
    );
    if (ff.status !== 0) {
      console.error(ff.stderr);
      throw new Error("ffmpeg transcode failed");
    }
    finalBuffer = await readFile(localPath);
    await unlink(downloaded).catch(() => {});
  } else {
    await writeFile(localPath, buffer);
    if (downloaded !== localPath) await unlink(downloaded).catch(() => {});
  }
  const sha = createHash("sha256").update(finalBuffer).digest("hex");
  await writeFile(
    path.join(outDir, `${fileName}.intake.json`),
    `${JSON.stringify({ ...intake, sha256: sha, bytes: finalBuffer.length, transcoded: shouldTranscode }, null, 2)}\n`,
  );
  if (uploadBlob) {
    const token =
      process.env.STORY_MUSIC_BLOB_READ_WRITE_TOKEN?.trim() ||
      process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (!token) throw new Error("STORY_MUSIC_BLOB_READ_WRITE_TOKEN is required for --upload-blob.");
    const requestedAccess = process.env.STORY_MUSIC_BLOB_ACCESS?.trim() || "public";
    if (!["public", "private"].includes(requestedAccess)) {
      throw new Error("STORY_MUSIC_BLOB_ACCESS must be public or private.");
    }
    const { put } = await import("@vercel/blob");
    const contentType = ext.toLowerCase() === ".mp3"
      ? "audio/mpeg"
      : [".ogg", ".oga"].includes(ext.toLowerCase())
        ? "audio/ogg"
        : ext.toLowerCase() === ".wav" ? "audio/wav" : "application/octet-stream";
    let access = requestedAccess;
    try {
      await put(blobPath, finalBuffer, {
        access,
        token,
        contentType,
        addRandomSuffix: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (access !== "public" || !/cannot use public access on a private store/i.test(message)) throw error;
      access = "private";
      await put(blobPath, finalBuffer, {
        access,
        token,
        contentType,
        addRandomSuffix: false,
      });
    }
    console.log(`Blob upload complete: ${blobPath} (${access}). This is NOT a catalog publication. Complete admin rights intake and publish separately.`);
  } else {
    console.log(`Saved ${localPath} (${finalBuffer.length} bytes). Use --upload-blob after curator sign-off to upload, then admin intake verify/publish.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
