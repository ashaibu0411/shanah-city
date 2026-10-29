import assert from "node:assert/strict";
import { inferCommunityMediaType, isCommunityAudioFile } from "../src/lib/community-media-shared";

class FakeFile {
  name: string;
  type: string;
  size: number;
  constructor(name: string, type: string, size = 4096) {
    this.name = name;
    this.type = type;
    this.size = size;
  }
}

/** Samsung mic capture: video/webm container, story filename, audio-only intent. */
const samsungVoice = new FakeFile("story-recording-1730123456789.webm", "video/webm") as File;
assert.equal(inferCommunityMediaType(samsungVoice), "audio");
assert.equal(isCommunityAudioFile(samsungVoice), true);

/** Mislabeled generic WebM must classify as audio (matches server saveCommunityMedia). */
const genericWebm = new FakeFile("recording.webm", "video/webm") as File;
assert.equal(inferCommunityMediaType(genericWebm), "audio");

console.log("community-media-upload-classify.test.ts OK");
