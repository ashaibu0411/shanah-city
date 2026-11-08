/**
 * Worship recording capture defaults (no browser APIs required).
 */
import assert from "node:assert/strict";
import {
  worshipRecorderMimeCandidatesForTests,
  worshipRecordingAudioConstraints,
  storyVoiceRecordingAudioConstraints,
} from "../src/lib/worship-audio-shared";

function testMicConstraints() {
  const c = worshipRecordingAudioConstraints();
  assert.equal(c.echoCancellation, false);
  assert.equal(c.noiseSuppression, false);
  assert.equal(c.autoGainControl, false);
  assert.equal("sampleRate" in c, false);
  assert.equal("channelCount" in c, false);
}

function testStoryNarrationConstraints() {
  const c = storyVoiceRecordingAudioConstraints();
  assert.equal(c.echoCancellation, true, "spoken narration should avoid echo");
  assert.equal(c.noiseSuppression, true, "spoken narration should suppress room noise");
  assert.equal(c.autoGainControl, true, "spoken narration should normalize quiet voice capture");
  assert.equal("sampleRate" in c, false, "do not force Safari sample rate");
  assert.equal("channelCount" in c, false, "do not force artificial stereo");
}

function testMimeCandidatesAreAudioOnly() {
  for (const mime of worshipRecorderMimeCandidatesForTests()) {
    assert.equal(mime.startsWith("audio/"), true, `expected audio mime, got ${mime}`);
    assert.equal(mime.includes("video/"), false, `video container must not be used: ${mime}`);
  }
}

function main() {
  testMicConstraints();
  testStoryNarrationConstraints();
  testMimeCandidatesAreAudioOnly();
  console.log("worship-recording-audio.test.ts: all passed");
}

main();
