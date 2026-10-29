import assert from "node:assert/strict";
import {
  isAllowedCatalogAudioStorageRef,
  isAllowedCatalogLocalAudioPath,
  isAllowedRemoteAudioUrl,
  isStoryMusicTestTrackId,
  resolveCatalogLocalPublicFile,
  resolveStoryMusicTestFixtureFile,
  storyMusicTestTrackVisible,
} from "../src/lib/story-music/story-music-audio-security";

process.env.STORY_MUSIC_POC_CATALOG_ENABLED = "";

function main() {
  assert.equal(isStoryMusicTestTrackId("poc-gh-adom-test"), true);
  assert.equal(storyMusicTestTrackVisible("poc-gh-adom-test"), false);

  process.env.STORY_MUSIC_POC_CATALOG_ENABLED = "1";
  assert.equal(storyMusicTestTrackVisible("poc-gh-adom-test"), true);

  assert.equal(isAllowedCatalogLocalAudioPath("/story-music/label/track.mp3"), true);
  assert.equal(isAllowedCatalogLocalAudioPath("/story-music-poc/test.wav"), false);
  assert.equal(isAllowedCatalogLocalAudioPath("/etc/passwd"), false);
  assert.equal(isAllowedCatalogLocalAudioPath("/story-music/../../../secret"), false);

  assert.equal(
    isAllowedCatalogAudioStorageRef("story-music://blob/story-music/audio/free-library/track.mp3"),
    true,
  );
  assert.equal(isAllowedCatalogAudioStorageRef("story-music://blob/evil.mp3"), false);

  assert.equal(isAllowedRemoteAudioUrl("https://blob.vercel-storage.com/x.mp3"), true);
  assert.equal(isAllowedRemoteAudioUrl("http://blob.vercel-storage.com/x.mp3"), false);
  assert.equal(isAllowedRemoteAudioUrl("https://evil.example.com/x.mp3"), false);

  process.env.STORY_MUSIC_POC_CATALOG_ENABLED = "1";
  const resolved = resolveStoryMusicTestFixtureFile("story-music-poc/ghana-worship-poc.wav");
  assert.ok(resolved, "POC wav should resolve under test-fixtures/");

  console.log("story-music-security.test.ts OK");
}

main();
