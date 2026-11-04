#!/usr/bin/env node
/** Sync discovery reviewStatus to published when catalog + rights already exist. */
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { isCatalogAndRightsPublished } from "./story-music-free-library-resume.mjs";
import { DEFAULT_IMPORT_CANDIDATE_IDS, FREE_LIBRARY_IMPORT_CANDIDATES } from "./story-music-rights-packets.mjs";

const DISCOVERY_PATH = path.join(process.cwd(), "data", "story-music-discovery-candidates.json");

const discovery = JSON.parse(await readFile(DISCOVERY_PATH, "utf8"));
const now = new Date().toISOString();
let updated = 0;

for (const id of DEFAULT_IMPORT_CANDIDATE_IDS) {
  const packet = FREE_LIBRARY_IMPORT_CANDIDATES[id];
  const row = discovery.candidates.find((c) => c.id === id);
  if (!row || !packet) continue;
  if (!isCatalogAndRightsPublished(packet.catalogTrackId)) continue;
  if (row.reviewStatus === "published" && row.publishedCatalogTrackId === packet.catalogTrackId) continue;
  row.reviewStatus = "published";
  row.publishedCatalogTrackId = packet.catalogTrackId;
  row.updatedAt = now;
  updated += 1;
}

if (updated > 0) {
  discovery.updatedAt = now;
  await writeFile(DISCOVERY_PATH, `${JSON.stringify(discovery, null, 2)}\n`);
}
console.log(JSON.stringify({ updated }, null, 2));
