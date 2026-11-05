#!/usr/bin/env node
/**
 * Publish a prepared intake JSON to data/story-music-rights-records.json + authorized catalog.
 * Requires STORY_MUSIC_ADMIN_WRITE_ENABLED=1 and curator attestation in environment.
 *
 *   node scripts/story-music-complete-intake-publish.mjs --intake=.tmp-story-music-ingest/foo.mp3.intake.json
 */

import { readFile, writeFile, rename } from "fs/promises";
import path from "path";
import { readFileSync } from "fs";

const ROOT = process.cwd();
const RIGHTS_PATH = path.join(ROOT, "data", "story-music-rights-records.json");
const CATALOG_PATH = path.join(ROOT, "data", "story-music-authorized-catalog.json");
const DISCOVERY_PATH = path.join(ROOT, "data", "story-music-discovery-candidates.json");

function loadEnvFile(filePath) {
  try {
    for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
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
loadEnvFile(path.join(ROOT, ".env"));

async function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`);
  await rename(tmp, filePath);
}

function assertAdminWrite() {
  if (process.env.STORY_MUSIC_ADMIN_WRITE_ENABLED?.trim() !== "1") {
    throw new Error("Set STORY_MUSIC_ADMIN_WRITE_ENABLED=1 for catalog publication.");
  }
  if (!process.env.STORY_MUSIC_CURATOR_NAME?.trim() || !process.env.STORY_MUSIC_CURATOR_ATTESTATION?.trim()) {
    throw new Error("Curator name and attestation required for publication.");
  }
}

function basenameRef(audioPath) {
  const parts = audioPath.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || "track";
}

async function main() {
  const intakePath = process.argv.find((a) => a.startsWith("--intake="))?.split("=")[1];
  const candidateId = process.argv.find((a) => a.startsWith("--candidate="))?.split("=")[1];
  const dryRun = process.argv.includes("--dry-run");
  if (!intakePath) {
    console.error("Usage: --intake=path/to/file.intake.json [--candidate=smd-...] [--dry-run]");
    process.exit(1);
  }

  assertAdminWrite();
  const intake = JSON.parse(await readFile(path.resolve(intakePath), "utf8"));
  const now = new Date().toISOString();
  const curator = process.env.STORY_MUSIC_CURATOR_NAME.trim();

  const rightsFile = JSON.parse(await readFile(RIGHTS_PATH, "utf8"));
  const catalogFile = JSON.parse(await readFile(CATALOG_PATH, "utf8"));

  const recordId = `smr-${intake.catalogTrackId}`;
  const record = {
    id: recordId,
    status: "published",
    artist: intake.artist,
    title: intake.title,
    recordingOwner: intake.recordingOwner,
    compositionPublishing: intake.compositionPublishing,
    documentReference: `${intake.documentReference}\nCurator: ${curator} (${now}).`,
    authorizedUses: intake.authorizedUses,
    streamingPermitted: intake.streamingPermitted,
    storagePermitted: intake.storagePermitted,
    territory: intake.territory,
    catalogTrackId: intake.catalogTrackId,
    audioPath: intake.audioPath,
    genres: intake.genres ?? ["worship"],
    tags: intake.tags ?? ["free-library"],
    licenseType: intake.licenseType,
    licenseUrl: intake.licenseUrl,
    attributionText: intake.attributionText,
    sourceUrl: intake.sourceUrl,
    createdAt: now,
    updatedAt: now,
    verifiedAt: now,
    publishedAt: now,
    notes: `Blob sha256 ${intake.sha256}; ${intake.bytes} bytes.`,
  };

  const catalogRow = {
    id: intake.catalogTrackId,
    title: intake.title,
    artist: intake.artist,
    providerTrackId: basenameRef(intake.audioPath),
    audioPath: intake.audioPath,
    genres: record.genres,
    tags: record.tags,
    rightsRecordId: recordId,
    status: "active",
    licenseType: intake.licenseType,
    licenseUrl: intake.licenseUrl,
    attributionText: intake.attributionText,
    sourceUrl: intake.sourceUrl,
  };

  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, record, catalogRow }, null, 2));
    return;
  }

  rightsFile.records = rightsFile.records.filter(
    (r) => r.catalogTrackId !== intake.catalogTrackId && r.id !== recordId,
  );
  rightsFile.records.push(record);
  catalogFile.tracks = catalogFile.tracks.filter((t) => t.id !== intake.catalogTrackId);
  catalogFile.tracks.push(catalogRow);

  await writeJsonAtomic(RIGHTS_PATH, rightsFile);
  await writeJsonAtomic(CATALOG_PATH, catalogFile);

  if (candidateId) {
    const discovery = JSON.parse(await readFile(DISCOVERY_PATH, "utf8"));
    const row = discovery.candidates.find((c) => c.id === candidateId);
    if (row) {
      row.reviewStatus = "published";
      row.publishedCatalogTrackId = intake.catalogTrackId;
      row.updatedAt = now;
      await writeJsonAtomic(DISCOVERY_PATH, discovery);
    }
  }

  console.log(JSON.stringify({ ok: true, catalogTrackId: intake.catalogTrackId, recordId }, null, 2));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
