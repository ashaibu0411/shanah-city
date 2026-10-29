#!/usr/bin/env node
/**
 * After human approval: download verified audio and prepare catalog intake fields.
 * Does NOT publish to production catalog without STORY_MUSIC_ADMIN_WRITE_ENABLED.
 *
 * Usage:
 *   node scripts/story-music-ingest-approved.mjs --candidate smd-xxx --dry-run
 *   node scripts/story-music-ingest-approved.mjs --candidate smd-xxx --out-dir ./.tmp-story-music-ingest
 *
 * Blob upload is manual follow-up via admin or a separate credentialed step.
 */

import { readFile, mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import { spawnSync } from "child_process";

const ROOT = process.cwd();
const DISCOVERY_PATH = path.join(ROOT, "data", "story-music-discovery-candidates.json");

function parseArgs(argv) {
  const candidate = argv.find((a) => a.startsWith("--candidate="))?.split("=")[1];
  const dryRun = argv.includes("--dry-run");
  const transcodeMp3 = argv.includes("--transcode-mp3");
  const outDir =
    argv.find((a) => a.startsWith("--out-dir="))?.split("=")[1] ??
    path.join(ROOT, ".tmp-story-music-ingest");
  return { candidate, dryRun, transcodeMp3, outDir };
}

function resolveDirectAudioUrl(row) {
  const u = row.recordingUrl ?? "";
  if (u.includes("upload.wikimedia.org") || u.includes("archive.org/download")) {
    return u.split("?")[0];
  }
  return u.startsWith("http") ? u : null;
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
  const { candidate, dryRun, transcodeMp3, outDir } = parseArgs(process.argv.slice(2));
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

  const audioUrl = resolveDirectAudioUrl(row);
  if (!audioUrl) {
    console.error("No direct recording URL on candidate.");
    process.exit(1);
  }

  const catalogTrackId = slug(`${row.artist}-${row.title}`) || candidate;
  let ext = path.extname(new URL(audioUrl).pathname) || ".ogg";
  const shouldTranscode =
    transcodeMp3 && !/\.mp3$/i.test(ext) && /\.(ogg|oga|opus|wav|flac)$/i.test(ext);
  if (shouldTranscode && !ffmpegAvailable()) {
    console.error("--transcode-mp3 requested but ffmpeg not found on PATH.");
    process.exit(1);
  }
  if (shouldTranscode) ext = ".mp3";
  const fileName = `${catalogTrackId}${ext}`;
  const blobPath = `story-music/audio/free-library/${fileName}`;

  const intake = {
    catalogTrackId,
    artist: row.artist,
    title: row.title,
    audioPath: `story-music://${blobPath}`,
    documentReference: row.rightsEvidenceRef ?? row.sourcePageUrl,
    recordingOwner: row.recordingRightsNote ?? row.artist,
    compositionPublishing: row.compositionRightsNote ?? "See rights evidence",
    authorizedUses: "In-app user-generated story background audio (Shanah City Stories)",
    streamingPermitted: true,
    storagePermitted: true,
    territory: "Worldwide",
    licenseType: row.licenseSlug,
    licenseUrl: row.licenseUrl,
    attributionText: row.attributionStatement,
    sourceUrl: row.sourcePageUrl,
  };

  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, intake, downloadFrom: audioUrl }, null, 2));
    return;
  }

  await mkdir(outDir, { recursive: true });
  const response = await fetch(audioUrl, { headers: { "User-Agent": "ShanahCityStoryMusic/1.0" } });
  if (!response.ok) throw new Error(`Download failed HTTP ${response.status}`);
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
  console.log(`Saved ${localPath} (${finalBuffer.length} bytes). Upload to Blob at ${blobPath}, then admin intake verify/publish.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
