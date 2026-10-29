process.env.STORY_MUSIC_HYBRID_ENABLED = "1";
process.env.STORY_MUSIC_FREE_LIBRARY_ENABLED = "1";
process.env.STORY_MUSIC_PRODUCTION_PILOT_ENABLED = "1";
process.env.STORY_MUSIC_STAGING_QA_LIBRARY = "";
process.env.STORY_MUSIC_POC_CATALOG_ENABLED = "";

import assert from "node:assert/strict";
import {
  isStoryMusicFreeLibraryLiveForMembers,
  isStoryMusicFreeLibraryLiveForViewer,
} from "../src/lib/story-music/story-music-free-library";
import {
  canUseFreeWorshipMusic,
  trackRequiresPilotGate,
  viewerCanAccessStoryMusicTrack,
} from "../src/lib/story-music/story-music-pilot-access";
import { loadAuthorizedProductionTrackRecords } from "../src/lib/story-music/story-music-catalog-loader";

const pilotTrack = loadAuthorizedProductionTrackRecords().find(
  (t) => t.id === "qa-production-pilot-instrumental-v1",
);
const stagingTrack = loadAuthorizedProductionTrackRecords().find(
  (t) => t.id === "qa-staging-shanah-instrumental-v1",
);

async function main() {
  assert.equal(isStoryMusicFreeLibraryLiveForMembers(), false, "pilot must not be live for all members");
  assert.ok(pilotTrack, "pilot catalog row must load when pilot enabled");
  assert.equal(stagingTrack, undefined, "staging QA row must not load without staging flag");

  assert.equal(trackRequiresPilotGate(pilotTrack!), true);

  const stranger = { id: "user-stranger", email: "stranger@example.com" };
  assert.equal(await canUseFreeWorshipMusic(stranger), false);
  assert.equal(await isStoryMusicFreeLibraryLiveForViewer(stranger), false);
  assert.equal(await viewerCanAccessStoryMusicTrack(stranger, pilotTrack!), false);

  process.env.STORY_MUSIC_PILOT_EMAILS = "qa.partner@example.com";
  const qa = { id: "user-qa", email: "QA.Partner@example.com" };
  assert.equal(await canUseFreeWorshipMusic(qa), true);
  assert.equal(await isStoryMusicFreeLibraryLiveForViewer(qa), true);
  assert.equal(await viewerCanAccessStoryMusicTrack(qa, pilotTrack!), true);

  console.log("story-music-pilot-access.test.ts OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
