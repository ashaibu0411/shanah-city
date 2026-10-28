import legacyCatalog from "../../../../data/community-story-music.json";
import type {
  StoryMusicPlaybackPlan,
  StoryMusicProvider,
  StoryMusicSearchFilters,
  StoryMusicTrackRecord,
} from "@/lib/story-music/types";
import { matchesStoryMusicSearch } from "@/lib/story-music/search";
import {
  isAllowedCatalogLocalAudioPath,
  isAllowedRemoteAudioUrl,
} from "@/lib/story-music/story-music-audio-security";
import { legacyMigrationAudioPath } from "@/lib/story-music/story-music-catalog-loader";

type LegacyRow = {
  id: string;
  title: string;
  artist: string;
  youtubeVideoId: string;
  audioUrl?: string;
  tags?: string[];
  startSeconds?: number;
};

/**
 * Preserves published story track ids and display metadata.
 * Hybrid mode does not attach or play via YouTube extraction — hosted audioUrl only if explicitly authorized.
 */
function mapLegacy(row: LegacyRow): StoryMusicTrackRecord {
  const migrationPath = legacyMigrationAudioPath(row.id);
  const hosted = migrationPath || row.audioUrl?.trim();
  const hostedOk =
    Boolean(hosted) &&
    (isAllowedCatalogLocalAudioPath(hosted!) ||
      (hosted!.startsWith("https://") && isAllowedRemoteAudioUrl(hosted!)));
  const playability = hostedOk ? "playable" : "unavailable";
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    provider: "legacy_catalog",
    providerTrackId: row.youtubeVideoId,
    playability,
    tags: row.tags,
    startSeconds: row.startSeconds,
    youtubeVideoId: row.youtubeVideoId,
    audioPath: hosted,
    unavailableReason: hostedOk
      ? undefined
      : migrationPath
        ? undefined
        : "Legacy catalog entry — pending licensed replacement (track id preserved).",
  };
}

const tracks = ((legacyCatalog.tracks ?? []) as LegacyRow[]).map(mapLegacy);

export const legacyCatalogProvider: StoryMusicProvider = {
  kind: "legacy_catalog",

  listAttachableTracks() {
    return [];
  },

  findTrackById(trackId: string) {
    const id = trackId.trim();
    if (!id) return null;
    return tracks.find((track) => track.id === id) ?? null;
  },

  search(filters: StoryMusicSearchFilters) {
    if (filters.attachableOnly) return [];
    const limit = filters.limit ?? 32;
    return tracks.filter((track) => matchesStoryMusicSearch(track, filters)).slice(0, limit);
  },

  async resolvePlayback(track: StoryMusicTrackRecord, origin: string): Promise<StoryMusicPlaybackPlan> {
    const startSeconds =
      typeof track.startSeconds === "number" && track.startSeconds >= 0
        ? Math.floor(track.startSeconds)
        : null;

    if (track.playability === "playable" && track.audioPath?.trim()) {
      const audioUrl = `${origin.replace(/\/$/, "")}/api/community/story-music/stream?trackId=${encodeURIComponent(track.id)}`;
      return {
        trackId: track.id,
        playability: "playable",
        mode: "audio",
        audioUrl,
        startSeconds,
        title: track.title,
        artist: track.artist,
        provider: track.provider,
      };
    }

    return {
      trackId: track.id,
      playability: "unavailable",
      mode: "unavailable",
      startSeconds,
      title: track.title,
      artist: track.artist,
      provider: track.provider,
      unavailableReason:
        track.unavailableReason ??
        "This song uses a legacy reference. A licensed audio mapping is required for playback in hybrid mode.",
    };
  },
};
