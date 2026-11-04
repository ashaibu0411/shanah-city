import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  DEFAULT_IMPORT_CANDIDATE_IDS,
  FREE_LIBRARY_IMPORT_CANDIDATES,
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

  for (const id of DEFAULT_IMPORT_CANDIDATE_IDS) {
    const packet = FREE_LIBRARY_IMPORT_CANDIDATES[id as keyof typeof FREE_LIBRARY_IMPORT_CANDIDATES];
    const row = discovery.candidates?.find((c: { id: string }) => c.id === id);
    assert.ok(row, `discovery row ${id}`);
    assert.ok(packet.recordingUrl.startsWith("https://upload.wikimedia.org/"));
    assert.equal(row.reviewStatus, "needs_review", `${id} must stay needs_review until attested import`);
    assert.ok(row.rightsEvidenceRef?.trim(), `${id} rightsEvidenceRef`);
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
    0,
    "no free-library worship tracks published yet — run attested import before member launch",
  );

  delete process.env.STORY_MUSIC_PRODUCTION_PILOT_ENABLED;
  delete process.env.STORY_MUSIC_STAGING_QA_LIBRARY;
  process.env.STORY_MUSIC_FREE_LIBRARY_ENABLED = "1";
  process.env.STORY_MUSIC_HYBRID_ENABLED = "1";
  process.env.NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED = "1";

  const memberTracks = countActiveFreeWorshipTracks();
  assert.equal(memberTracks, 0, "member-visible free worship count must match published free-library catalog");

  console.log("story-music-catalog-integrity.test.ts OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
