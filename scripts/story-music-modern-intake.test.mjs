import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveApprovedStoryMusicAudioUrl } from "./story-music-audio-source-policy.mjs";
import { loadMergedImportCandidates } from "./story-music-rights-packets.mjs";

const discovery = JSON.parse(readFileSync("data/story-music-discovery-candidates.json", "utf8"));
const catalog = JSON.parse(readFileSync("data/story-music-authorized-catalog.json", "utf8"));
const rights = JSON.parse(readFileSync("data/story-music-rights-records.json", "utf8"));
const approved = JSON.parse(readFileSync("data/story-music-hmg-approved-qc.json", "utf8"));
const modern = JSON.parse(readFileSync("data/story-music-modern-import-packets.json", "utf8")).packets;
const packets = loadMergedImportCandidates();
const entries = Object.entries(modern);
assert.equal(entries.length, 8);
for (const [id, packet] of entries) {
  const candidate = discovery.candidates.find((row) => row.id === id);
  assert.ok(candidate, `missing discovery candidate: ${id}`);
  assert.equal(candidate.reviewStatus, "published", "only approved and audio-verified tracks should be published");
  assert.equal(candidate.publishedCatalogTrackId, packet.catalogTrackId);
  assert.equal(candidate.source, "heartfelt_media");
  assert.equal(candidate.recordingUrl, packet.recordingUrl);
  assert.equal(packet.licenseSlug, "CC BY 4.0");
  assert.ok(packet.rightsEvidenceRef?.includes("heartfeltmg.com"));
  assert.ok(packet.attributionStatement?.includes("CC BY 4.0"));
  assert.equal(packets[id]?.catalogTrackId, packet.catalogTrackId);
  assert.equal(resolveApprovedStoryMusicAudioUrl(packet.recordingUrl), packet.recordingUrl);
  const publishedTrack = catalog.tracks.find((track) => track.id === packet.catalogTrackId);
  const recording = approved.tracks.find((row) => row.id === packet.catalogTrackId);
  const publishedRights = rights.records.find((row) => row.catalogTrackId === packet.catalogTrackId);
  assert.ok(recording, "each published track must have SHA256 QC evidence");
  assert.ok(publishedTrack, "approved track must be published");
  assert.equal(publishedTrack.audioPath, `story-music://blob/${recording.audioPath}`);
  assert.equal(publishedTrack.status, "active");
  assert.equal(publishedTrack.licenseType, "CC BY 4.0");
  assert.ok(publishedTrack.attributionText.includes("heartfeltmg.com"));
  assert.ok(publishedTrack.attributionText.includes("creativecommons.org/licenses/by/4.0"));
  assert.ok(publishedTrack.sourceUrl.includes("/songs/"));
  assert.equal(publishedRights?.status, "published");
  assert.equal(publishedRights?.streamingPermitted, true);
  assert.equal(publishedRights?.storagePermitted, true);
  assert.ok(publishedRights?.notes?.includes(recording.sha256));
}
for (const bad of [
  "http://www.heartfeltmg.com/music/Lord%20We%20Lift.mp3",
  "https://www.heartfeltmg.com.evil.com/music/Lord%20We%20Lift.mp3",
  "https://www.heartfeltmg.com/music/../../secrets.mp3",
  "https://www.heartfeltmg.com/music/clip.mp3?token=a",
  "https://www.heartfeltmg.com/music/clip.wav",
  "https://www.heartfeltmg.com/music/%2fsecret.mp3",
  "https://evil.com/track.mp3",
]) {
  assert.equal(resolveApprovedStoryMusicAudioUrl(bad), null, bad);
}
const leads = JSON.parse(readFileSync("data/story-music-afrogospel-rights-leads.json", "utf8"));
assert.ok(leads.leads.length >= 4);
assert.ok(leads.leads.every((lead) => lead.reviewStatus === "hold_for_artist_permission"));
console.log("story-music-modern-intake.test.mjs OK (8 approved and verified published tracks, 4 blocked artist leads)");
