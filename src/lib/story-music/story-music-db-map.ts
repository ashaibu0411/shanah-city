import type { StoryMusicCatalogTrack, StoryMusicRightsRecord } from "@prisma/client";
import type { StoryMusicGenre, StoryMusicTrackRecord } from "@/lib/story-music/types";
import type { StoryMusicRightsRecord as StoryMusicRightsRecordApi } from "@/lib/story-music/story-music-rights-types";
import {
  effectiveRightsStatus,
  parseTerritoryCodes,
  rightsAllowPlayback,
  territoryAllowsPlayback,
} from "@/lib/story-music/story-music-policy";

function parseGenres(json: string | null | undefined): StoryMusicGenre[] | undefined {
  if (!json?.trim()) return undefined;
  try {
    return JSON.parse(json) as StoryMusicGenre[];
  } catch {
    return undefined;
  }
}

function parseTags(json: string | null | undefined): string[] | undefined {
  if (!json?.trim()) return undefined;
  try {
    return JSON.parse(json) as string[];
  } catch {
    return undefined;
  }
}

export function mapDbCatalogToTrack(
  catalog: StoryMusicCatalogTrack,
  rights: StoryMusicRightsRecord,
  viewerCountry?: string | null,
): StoryMusicTrackRecord | null {
  const rightsRow = {
    status: rights.status,
    licenseStartDate: rights.licenseStartDate,
    licenseEndDate: rights.licenseEndDate,
    streamingPermitted: rights.streamingPermitted,
    storagePermitted: rights.storagePermitted,
    territoryCodesJson: rights.territoryCodesJson,
    revokedAt: rights.revokedAt,
  };

  if (catalog.revokedAt || catalog.playability !== "playable") return null;
  if (!rightsAllowPlayback(rightsRow)) return null;
  if (effectiveRightsStatus(rightsRow) !== "published") return null;
  if (!territoryAllowsPlayback(rights.territoryCodesJson, viewerCountry)) return null;
  if (!catalog.audioStorageRef?.trim()) return null;

  return {
    id: catalog.id,
    title: catalog.title,
    artist: catalog.artist,
    provider: "church_authorized",
    providerTrackId: catalog.id,
    playability: "playable",
    country: catalog.country ?? undefined,
    language: catalog.language ?? undefined,
    genres: parseGenres(catalog.genresJson),
    tags: parseTags(catalog.tagsJson),
    startSeconds: catalog.startSeconds ?? undefined,
    audioPath: catalog.audioStorageRef,
  };
}

export function mapLegacyMigrationToTrack(input: {
  legacyTrackId: string;
  title: string;
  artist: string;
  audioStorageRef: string;
  startSeconds?: number | null;
  tags?: string[];
}): StoryMusicTrackRecord {
  return {
    id: input.legacyTrackId,
    title: input.title,
    artist: input.artist,
    provider: "legacy_catalog",
    providerTrackId: input.legacyTrackId,
    playability: "playable",
    audioPath: input.audioStorageRef,
    tags: input.tags,
    startSeconds: input.startSeconds ?? undefined,
  };
}

export function territoryCodesToJson(codes: string[]) {
  return JSON.stringify(codes.map((c) => c.toUpperCase()));
}

export function mapDbRightsRecordToApi(record: StoryMusicRightsRecord): StoryMusicRightsRecordApi {
  const status = effectiveRightsStatus(record);
  return {
    id: record.id,
    status,
    artist: record.artist,
    title: record.title,
    recordingOwner: record.recordingOwner,
    compositionPublishing: record.compositionPublishing,
    documentReference: record.documentReference,
    authorizedUses: record.authorizedUses,
    streamingPermitted: record.streamingPermitted,
    storagePermitted: record.storagePermitted,
    territory: record.territory,
    licenseStartDate: record.licenseStartDate?.toISOString(),
    licenseEndDate: record.licenseEndDate?.toISOString(),
    revocationContact: record.revocationContact ?? undefined,
    catalogTrackId: record.catalogTrackId,
    audioPath: record.audioStorageRef ?? undefined,
    country: record.country ?? undefined,
    language: record.language ?? undefined,
    genres: parseGenres(record.genresJson),
    tags: parseTags(record.tagsJson),
    startSeconds: record.startSeconds ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    verifiedAt: record.verifiedAt?.toISOString(),
    verifiedByUserId: record.verifiedByUserId ?? undefined,
    publishedAt: record.publishedAt?.toISOString(),
    revokedAt: record.revokedAt?.toISOString(),
    notes: record.notes ?? undefined,
  };
}
