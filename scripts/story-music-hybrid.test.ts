process.env.STORY_MUSIC_HYBRID_ENABLED = "1";
process.env.STORY_MUSIC_POC_CATALOG_ENABLED = "1";

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  assertTrackAttachable,
  findStoryMusicTrack,
  resolveStoryMusicPlayback,
  searchStoryMusicTracks,
} from "../src/lib/story-music/story-music-service";

const ORIGIN = "http://127.0.0.1:3000";

async function main() {
  const poc = searchStoryMusicTracks({ limit: 20 });
  assert.ok(poc.length >= 9, "expected church POC tracks in hybrid search");
  assert.ok(
    poc.every((t) => t.playability === "playable"),
    "search must only return attachable playable tracks",
  );

  const legacyBlocked = assertTrackAttachable("way-maker");
  assert.equal(legacyBlocked.ok, false, "legacy youtube-only tracks must not attach in hybrid");

  const legacyStillFound = findStoryMusicTrack("way-maker");
  assert.ok(legacyStillFound, "legacy track id must resolve for published stories");
  assert.equal(legacyStillFound?.playability, "unavailable");

  const attach = assertTrackAttachable("poc-gh-adom-test");
  assert.equal(attach.ok, true);

  const wavPath = path.join(process.cwd(), "public", "story-music-poc", "ghana-worship-poc.wav");
  assert.ok(existsSync(wavPath), "POC wav must exist (run generate-story-music-poc-audio.mjs)");

  const plan = await resolveStoryMusicPlayback("poc-gh-adom-test", ORIGIN);
  assert.ok(plan);
  assert.equal(plan.mode, "audio");
  assert.equal(plan.playability, "playable");
  assert.ok(plan.audioUrl?.includes("/story-music-poc/ghana-worship-poc.wav"));

  const legacyPlan = await resolveStoryMusicPlayback("way-maker", ORIGIN);
  assert.ok(legacyPlan);
  assert.equal(legacyPlan.mode, "unavailable");

  const byCountry = searchStoryMusicTracks({ country: "NG", limit: 10 });
  assert.ok(byCountry.some((t) => t.id === "poc-ng-gospel-test"));

  console.log("story-music-hybrid.test.ts OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
