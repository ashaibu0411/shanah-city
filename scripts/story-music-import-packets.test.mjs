import assert from "node:assert/strict";
import { FREE_LIBRARY_IMPORT_CANDIDATES, DEFAULT_IMPORT_CANDIDATE_IDS } from "./story-music-rights-packets.mjs";

for (const id of DEFAULT_IMPORT_CANDIDATE_IDS) {
  const packet = FREE_LIBRARY_IMPORT_CANDIDATES[id];
  assert.ok(packet, id);
  assert.ok(packet.recordingUrl.startsWith("https://upload.wikimedia.org/"));
  assert.ok(packet.rightsEvidenceRef?.trim());
  assert.ok(packet.recordingRightsNote?.trim());
  assert.ok(packet.compositionRightsNote?.trim());
  assert.ok(packet.territory?.trim());
  assert.match(packet.recordingUrl, /\.(mp3|ogg)(\?|$)/i);
}

console.log("story-music-import-packets.test.mjs OK");
