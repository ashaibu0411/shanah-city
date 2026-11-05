#!/usr/bin/env node
/**
 * Verify all free-library catalog rows have matching Blob objects.
 */
import { readFileSync } from "fs";
import path from "path";
import { head } from "@vercel/blob";

function loadEnvFile(filePath) {
  try {
    for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i <= 0) continue;
      const key = t.slice(0, i).trim();
      if (process.env[key]) continue;
      let val = t.slice(i + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env.production.local"));

const token =
  process.env.STORY_MUSIC_BLOB_READ_WRITE_TOKEN?.trim() || process.env.BLOB_READ_WRITE_TOKEN?.trim();

const CATALOG_PATH = path.join(process.cwd(), "data", "story-music-authorized-catalog.json");

function blobPathFromAudioPath(audioPath) {
  const prefix = "story-music://blob/";
  if (!audioPath?.startsWith(prefix)) return null;
  return audioPath.slice(prefix.length);
}

async function main() {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  const tracks = catalog.tracks ?? [];
  const freeLibraryTracks = tracks.filter((t) => t.tags?.includes("free-library"));
  const report = {
    expectedCatalogIds: freeLibraryTracks.length,
    tracks: [],
    ok: true,
  };

  if (!token || token.length < 20) {
    report.ok = false;
    report.blocker = "Missing or invalid-length Blob token in local env (run check-import-env)";
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  for (const row of freeLibraryTracks) {
    const id = row.id;
    const entry = { id, inCatalog: Boolean(row), blobPath: null, blobExists: false, size: null };
    if (!row) {
      report.ok = false;
      report.tracks.push(entry);
      continue;
    }
    const blobPath = blobPathFromAudioPath(row.audioPath);
    entry.blobPath = blobPath;
    if (!blobPath) {
      report.ok = false;
      report.tracks.push(entry);
      continue;
    }
    try {
      const meta = await head(blobPath, { token });
      entry.blobExists = true;
      entry.size = meta.size ?? null;
    } catch {
      report.ok = false;
    }
    report.tracks.push(entry);
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
