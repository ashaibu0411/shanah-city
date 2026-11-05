#!/usr/bin/env node
/** Remove catalog/rights rows and revert discovery for quarantined track ids. */
import { readFile, writeFile } from "fs/promises";
import path from "path";

const ROOT = process.cwd();
const ids = process.argv.slice(2);
if (ids.length === 0) {
  console.error("Usage: node story-music-quarantine-tracks.mjs <catalogTrackId>...");
  process.exit(1);
}

const idSet = new Set(ids);
const CATALOG = path.join(ROOT, "data", "story-music-authorized-catalog.json");
const RIGHTS = path.join(ROOT, "data", "story-music-rights-records.json");
const DISCOVERY = path.join(ROOT, "data", "story-music-discovery-candidates.json");

const catalog = JSON.parse(await readFile(CATALOG, "utf8"));
const rights = JSON.parse(await readFile(RIGHTS, "utf8"));
const discovery = JSON.parse(await readFile(DISCOVERY, "utf8"));

catalog.tracks = catalog.tracks.filter((t) => !idSet.has(t.id));
rights.records = rights.records.filter((r) => !idSet.has(r.catalogTrackId));

for (const row of discovery.candidates) {
  if (idSet.has(row.publishedCatalogTrackId) || idSet.has(row.catalogTrackId)) {
    row.reviewStatus = "rejected";
    row.rejectionReason = "Quarantined: failed vocal gospel QC / ineligible for member library.";
    row.publishedCatalogTrackId = undefined;
    row.updatedAt = new Date().toISOString();
  }
}

await writeFile(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`);
await writeFile(RIGHTS, `${JSON.stringify(rights, null, 2)}\n`);
await writeFile(DISCOVERY, `${JSON.stringify(discovery, null, 2)}\n`);
console.log(JSON.stringify({ quarantined: ids }, null, 2));
