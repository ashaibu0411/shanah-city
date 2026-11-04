#!/usr/bin/env node
/**
 * Import curator-approved free-library recordings: patch discovery row, download, Blob upload, catalog publish.
 *
 * Requires:
 *   STORY_MUSIC_CURATOR_NAME
 *   STORY_MUSIC_CURATOR_ATTESTATION  (real church authorization — not committed)
 *   STORY_MUSIC_BLOB_READ_WRITE_TOKEN or BLOB_READ_WRITE_TOKEN
 *   STORY_MUSIC_ADMIN_WRITE_ENABLED=1
 *
 *   node scripts/story-music-import-free-library.mjs [--dry-run] [--candidates=id1,id2]
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { readFileSync } from "fs";
import { spawnSync } from "child_process";
import {
  DEFAULT_IMPORT_CANDIDATE_IDS,
  FREE_LIBRARY_IMPORT_CANDIDATES,
} from "./story-music-rights-packets.mjs";

const ROOT = process.cwd();
const DISCOVERY_PATH = path.join(ROOT, "data", "story-music-discovery-candidates.json");
const OUT_DIR = path.join(ROOT, ".tmp-story-music-ingest");

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
loadEnvFile(path.join(ROOT, ".env.production.local"));
loadEnvFile(path.join(ROOT, ".env"));

function parseCandidateIds(argv) {
  const fromArg = argv.find((a) => a.startsWith("--candidates="))?.split("=")[1];
  if (fromArg?.trim()) return fromArg.split(",").map((s) => s.trim()).filter(Boolean);
  return DEFAULT_IMPORT_CANDIDATE_IDS;
}

function runNode(script, args, env = process.env) {
  const r = spawnSync(process.execPath, [path.join(ROOT, "scripts", script), ...args], {
    cwd: ROOT,
    env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return r;
}

async function applyPacketToCandidate(row, packet) {
  row.catalogTrackId = packet.catalogTrackId;
  row.title = packet.title;
  row.artist = packet.artist;
  row.recordingUrl = packet.recordingUrl;
  row.licenseSlug = packet.licenseSlug;
  row.licenseUrl = packet.licenseUrl;
  row.attributionStatement = packet.attributionStatement;
  row.rightsEvidenceRef = packet.rightsEvidenceRef;
  row.recordingRightsNote = packet.recordingRightsNote;
  row.compositionRightsNote = packet.compositionRightsNote;
  row.territory = packet.territory;
  row.streamingPermitted = true;
  row.storagePermitted = true;
  row.genres = packet.genres;
  row.reviewStatus = "approved";
  row.updatedAt = new Date().toISOString();
  if (packet.tags) row.tags = [...new Set([...(row.tags ?? []), ...packet.tags])];
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const ids = parseCandidateIds(process.argv.slice(2));
  const curator = process.env.STORY_MUSIC_CURATOR_NAME?.trim();
  const attestation = process.env.STORY_MUSIC_CURATOR_ATTESTATION?.trim();
  const blob =
    process.env.STORY_MUSIC_BLOB_READ_WRITE_TOKEN?.trim() || process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const adminWrite = process.env.STORY_MUSIC_ADMIN_WRITE_ENABLED?.trim() === "1";

  const blockers = [];
  if (!curator || !attestation) {
    blockers.push("Missing STORY_MUSIC_CURATOR_NAME or STORY_MUSIC_CURATOR_ATTESTATION");
  }
  if (!dryRun && !blob) blockers.push("Missing STORY_MUSIC_BLOB_READ_WRITE_TOKEN (or BLOB_READ_WRITE_TOKEN)");
  if (!dryRun && !adminWrite) blockers.push("Missing STORY_MUSIC_ADMIN_WRITE_ENABLED=1");

  const discovery = JSON.parse(await readFile(DISCOVERY_PATH, "utf8"));
  const results = [];
  await mkdir(OUT_DIR, { recursive: true });
  const tempDiscoveryPath = path.join(OUT_DIR, "discovery-import-snapshot.json");

  for (const id of ids) {
    const packet = FREE_LIBRARY_IMPORT_CANDIDATES[id];
    const row = discovery.candidates.find((c) => c.id === id);
    if (!packet || !row) {
      results.push({ id, ok: false, error: "unknown candidate or missing rights packet" });
      continue;
    }
    await applyPacketToCandidate(row, packet);

    if (dryRun) {
      await writeFile(tempDiscoveryPath, `${JSON.stringify(discovery, null, 2)}\n`);
      const ingestDry = runNode("story-music-ingest-approved.mjs", [`--candidate=${id}`, "--dry-run"], {
        ...process.env,
        STORY_MUSIC_DISCOVERY_PATH: tempDiscoveryPath,
      });
      results.push({
        id,
        ok: ingestDry.status === 0,
        dryRun: true,
        catalogTrackId: packet.catalogTrackId,
        ingest: ingestDry.stdout?.trim().slice(0, 500),
        blockers,
      });
      continue;
    }

    if (blockers.length) {
      results.push({ id, ok: false, error: blockers.join("; ") });
      continue;
    }

    await writeFile(DISCOVERY_PATH, `${JSON.stringify(discovery, null, 2)}\n`);

    const ingest = runNode("story-music-ingest-approved.mjs", [
      `--candidate=${id}`,
      "--upload-blob",
      `--out-dir=${OUT_DIR}`,
    ]);
    if (ingest.status !== 0) {
      results.push({
        id,
        ok: false,
        error: "ingest failed",
        stderr: ingest.stderr?.slice(-400),
      });
      continue;
    }

    const intakeFile = path.join(
      OUT_DIR,
      `${packet.catalogTrackId}.mp3.intake.json`,
    );
    const publish = runNode("story-music-complete-intake-publish.mjs", [
      `--intake=${intakeFile}`,
      `--candidate=${id}`,
    ]);
    results.push({
      id,
      ok: publish.status === 0,
      catalogTrackId: packet.catalogTrackId,
      publish: publish.stdout?.trim(),
      stderr: publish.status !== 0 ? publish.stderr?.slice(-400) : undefined,
    });
  }

  if (!dryRun && results.some((r) => r.ok)) {
    await writeFile(DISCOVERY_PATH, `${JSON.stringify(discovery, null, 2)}\n`);
  }

  const imported = results.filter((r) => r.ok && !r.dryRun).length;
  console.log(
    JSON.stringify(
      {
        dryRun,
        imported,
        blockers,
        results,
      },
      null,
      2,
    ),
  );
  process.exit(imported > 0 || (dryRun && results.every((r) => r.ok)) ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
