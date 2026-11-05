import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  DEFAULT_IMPORT_CANDIDATE_IDS,
  FREE_LIBRARY_IMPORT_CANDIDATES,
  VOCAL_IMPORT_CANDIDATE_IDS,
} from "./story-music-rights-packets.mjs";
import { countActiveFreeWorshipTracks } from "../src/lib/story-music/story-music-free-library";
import { STORY_MUSIC_PRODUCTION_PILOT_TAG } from "../src/lib/story-music/story-music-config";

function loadJson(rel: string) {
  return JSON.parse(readFileSync(path.join(process.cwd(), rel), "utf8"));
}

async function main() {
  const discovery = loadJson("data/story-music-discovery-candidates.json");
  const catalog = loadJson("data/story-music-authorized-catalog.json");
  const rights = loadJson("data/story-music-rights-records.json");

  const LAUNCH_IDS = (catalog.tracks ?? [])
    .filter((t: { tags?: string[] }) => t.tags?.includes("free-library"))
    .map((t: { id: string }) => t.id);

  assert.ok(LAUNCH_IDS.length >= 14, "expected at least 14 free-library tracks after vocal expansion");

  for (const id of DEFAULT_IMPORT_CANDIDATE_IDS) {
    const packet = FREE_LIBRARY_IMPORT_CANDIDATES[id as keyof typeof FREE_LIBRARY_IMPORT_CANDIDATES];
    const row = discovery.candidates?.find((c: { id: string }) => c.id === id);
    assert.ok(row, `discovery row ${id}`);
    assert.ok(packet.recordingUrl.startsWith("https://upload.wikimedia.org/"));
    assert.equal(row.reviewStatus, "published", `${id} must be published after successful import`);
    assert.equal(row.publishedCatalogTrackId, packet.catalogTrackId, `${id} publishedCatalogTrackId`);
    assert.ok(row.rightsEvidenceRef?.trim(), `${id} rightsEvidenceRef`);
  }

  for (const id of VOCAL_IMPORT_CANDIDATE_IDS) {
    const packet = FREE_LIBRARY_IMPORT_CANDIDATES[id as keyof typeof FREE_LIBRARY_IMPORT_CANDIDATES];
    const row = discovery.candidates?.find((c: { id: string }) => c.id === id);
    assert.ok(row, `vocal discovery row ${id}`);
    assert.equal(row.reviewStatus, "published", `${id} vocal must be published after import`);
    assert.equal(row.publishedCatalogTrackId, packet.catalogTrackId, `${id} vocal publishedCatalogTrackId`);
    assert.equal(row.storagePermitted, true, `${id} storagePermitted after import packet`);
  }

  const catalogIds = new Set((catalog.tracks ?? []).map((t: { id: string }) => t.id));
  for (const record of rights.records ?? []) {
    if (record.status !== "published") continue;
    assert.ok(
      catalogIds.has(record.catalogTrackId),
      `rights record ${record.id} missing catalog row ${record.catalogTrackId}`,
    );
  }

  const freeLibraryPublished = (catalog.tracks ?? []).filter(
    (t: { tags?: string[] }) =>
      t.tags?.includes("free-library") && !t.tags?.includes(STORY_MUSIC_PRODUCTION_PILOT_TAG),
  );
  assert.equal(
    freeLibraryPublished.length,
    LAUNCH_IDS.length,
    "free-library launch tracks must be published in catalog",
  );
  for (const id of LAUNCH_IDS) {
    assert.ok(
      freeLibraryPublished.some((t: { id: string }) => t.id === id),
      `catalog missing launch track ${id}`,
    );
  }

  delete process.env.STORY_MUSIC_PRODUCTION_PILOT_ENABLED;
  delete process.env.STORY_MUSIC_STAGING_QA_LIBRARY;
  process.env.STORY_MUSIC_FREE_LIBRARY_ENABLED = "1";
  process.env.STORY_MUSIC_HYBRID_ENABLED = "1";
  process.env.NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED = "1";

  const memberTracks = countActiveFreeWorshipTracks();
  assert.equal(
    memberTracks,
    LAUNCH_IDS.length,
    "member-visible free worship count must match published free-library catalog",
  );

  console.log("story-music-catalog-integrity.test.ts OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
