/**
 * Worship recording capture defaults (no browser APIs required).
 */
import assert from "node:assert/strict";
import {
  worshipRecorderMimeCandidatesForTests,
  worshipRecordingAudioConstraints,
} from "../src/lib/worship-audio-shared";

function testMicConstraints() {
  const c = worshipRecordingAudioConstraints();
  assert.equal(c.echoCancellation, false);
  assert.equal(c.noiseSuppression, false);
  assert.equal(c.autoGainControl, false);
  assert.equal("sampleRate" in c, false);
  assert.equal("channelCount" in c, false);
}

function testMimeCandidatesAreAudioOnly() {
  for (const mime of worshipRecorderMimeCandidatesForTests()) {
    assert.equal(mime.startsWith("audio/"), true, `expected audio mime, got ${mime}`);
    assert.equal(mime.includes("video/"), false, `video container must not be used: ${mime}`);
  }
}

function main() {
  testMicConstraints();
  testMimeCandidatesAreAudioOnly();
  console.log("worship-recording-audio.test.ts: all passed");
}

main();
