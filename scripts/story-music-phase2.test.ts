/**
 * Phase 2 unit tests — no production DB required.
 */
import assert from "node:assert/strict";
import {
  effectiveRightsStatus,
  rightsAllowPlayback,
  storyUseAuthorized,
  territoryAllowsPlayback,
} from "../src/lib/story-music/story-music-policy";
import {
  encodeAudioBlobRef,
  encodeEvidenceBlobRef,
  decodeBlobPathname,
  STORY_MUSIC_BLOB_REF_SCHEME,
  STORY_MUSIC_EVIDENCE_REF_SCHEME,
} from "../src/lib/story-music/story-music-storage-ref";
import { mapDbCatalogToTrack, mapLegacyMigrationToTrack } from "../src/lib/story-music/story-music-db-map";
import {
  storyMusicDbCatalogEnabled,
  storyMusicHybridEnabled,
  storyMusicHybridClientEnabled,
} from "../src/lib/story-music/story-music-config";

function main() {
  delete process.env.STORY_MUSIC_HYBRID_ENABLED;
  delete process.env.NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED;
  delete process.env.STORY_MUSIC_DB_CATALOG;
  delete process.env.STORY_MUSIC_POC_CATALOG_ENABLED;
  delete process.env.STORY_MUSIC_ADMIN_WRITE_ENABLED;

  assert.equal(storyMusicHybridEnabled(), false, "hybrid must default off");
  assert.equal(storyMusicHybridClientEnabled(), false, "client hybrid must default off");
  assert.equal(storyMusicDbCatalogEnabled(), false, "DB catalog must default off");

  assert.equal(storyUseAuthorized("In-app user-generated story background audio"), true);
  assert.equal(storyUseAuthorized("Podcast only"), false);

  const now = new Date("2026-06-01T12:00:00Z");
  const expiredRow = {
    status: "published",
    licenseStartDate: new Date("2020-01-01"),
    licenseEndDate: new Date("2026-01-01"),
    streamingPermitted: true,
    storagePermitted: true,
    territoryCodesJson: null,
    revokedAt: null,
  };
  assert.equal(effectiveRightsStatus(expiredRow, now), "expired");
  assert.equal(rightsAllowPlayback(expiredRow, now), false);

  const usOnly = JSON.stringify(["US"]);
  assert.equal(territoryAllowsPlayback(usOnly, "US"), true);
  assert.equal(territoryAllowsPlayback(usOnly, "GH"), false);
  assert.equal(territoryAllowsPlayback(usOnly, null), true, "unknown viewer country passes open check");

  const audioRef = encodeAudioBlobRef("story-music/audio/pilot/track.wav");
  assert.ok(audioRef.startsWith(STORY_MUSIC_BLOB_REF_SCHEME));
  assert.equal(decodeBlobPathname(audioRef), "story-music/audio/pilot/track.wav");
  assert.equal(decodeBlobPathname("https://blob.vercel-storage.com/secret"), null);

  const evidenceRef = encodeEvidenceBlobRef("story-music/evidence/smr-1/license.pdf");
  assert.ok(evidenceRef.startsWith(STORY_MUSIC_EVIDENCE_REF_SCHEME));
  assert.equal(decodeBlobPathname(evidenceRef), "story-music/evidence/smr-1/license.pdf");

  const catalogRow = {
    id: "pilot-gh-test",
    rightsRecordId: "smr-1",
    title: "Test Hymn",
    artist: "POC Choir",
    providerKind: "church_authorized",
    audioStorageRef: audioRef,
    audioContentType: "audio/wav",
    startSeconds: 0,
    country: "GH",
    language: "en",
    genresJson: null,
    tagsJson: null,
    playability: "playable",
    publishedAt: new Date("2026-01-01"),
    revokedAt: null,
  };
  const rightsRow = {
    id: "smr-1",
    status: "published",
    artist: "POC Choir",
    title: "Test Hymn",
    recordingOwner: "Church",
    compositionPublishing: "Church",
    documentReference: "DOC-1",
    evidenceSummary: null,
    authorizedUses: "story background",
    streamingPermitted: true,
    storagePermitted: true,
    territory: "GH",
    territoryCodesJson: JSON.stringify(["GH"]),
    licenseStartDate: new Date("2020-01-01"),
    licenseEndDate: new Date("2030-01-01"),
    revocationContact: null,
    catalogTrackId: "pilot-gh-test",
    country: "GH",
    language: "en",
    genresJson: null,
    tagsJson: null,
    startSeconds: 0,
    audioStorageRef: audioRef,
    audioContentType: "audio/wav",
    audioByteLength: 1000,
    proposedByUserId: null,
    proposedAt: null,
    verifiedAt: new Date("2026-01-01"),
    verifiedByUserId: "admin",
    publishedAt: new Date("2026-01-01"),
    publishedByUserId: "admin",
    revokedAt: null,
    revokedByUserId: null,
    revokeReason: null,
    notes: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };

  const mappedGh = mapDbCatalogToTrack(catalogRow, rightsRow, "GH");
  assert.ok(mappedGh);
  assert.equal(mappedGh?.audioPath, audioRef);
  assert.equal(mappedGh?.playability, "playable");

  const mappedNg = mapDbCatalogToTrack(catalogRow, rightsRow, "NG");
  assert.equal(mappedNg, null, "territory restriction must hide track");

  const legacy = mapLegacyMigrationToTrack({
    legacyTrackId: "way-maker",
    title: "Way Maker",
    artist: "Sinach",
    audioStorageRef: audioRef,
    startSeconds: 10,
  });
  assert.equal(legacy.id, "way-maker");
  assert.equal(legacy.provider, "legacy_catalog");
  assert.ok(legacy.audioPath?.startsWith(STORY_MUSIC_BLOB_REF_SCHEME));

  console.log("story-music-phase2.test.ts OK");
}

main();
