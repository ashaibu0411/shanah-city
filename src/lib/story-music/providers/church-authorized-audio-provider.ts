import churchCatalog from "../../../../data/story-music-church-audio.json";
import type {
  StoryMusicPlaybackPlan,
  StoryMusicProvider,
  StoryMusicSearchFilters,
  StoryMusicTrackRecord,
} from "@/lib/story-music/types";
import { matchesStoryMusicSearch } from "@/lib/story-music/search";
import {
  isAllowedCatalogLocalAudioPath,
  storyMusicTestTrackVisible,
} from "@/lib/story-music/story-music-audio-security";

type ChurchTrackRow = {
  id: string;
  title: string;
  artist: string;
  providerTrackId: string;
  audioPath: string;
  country?: string;
  language?: string;
  genres?: StoryMusicTrackRecord["genres"];
  tags?: string[];
  startSeconds?: number;
};

function mapRow(row: ChurchTrackRow): StoryMusicTrackRecord {
  const audioPath = row.audioPath?.trim();
  const pathOk = audioPath ? isAllowedCatalogLocalAudioPath(audioPath) : false;
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    provider: "church_authorized",
    providerTrackId: row.providerTrackId,
    playability: audioPath && pathOk ? "playable" : "unavailable",
    country: row.country,
    language: row.language,
    genres: row.genres,
    tags: row.tags,
    startSeconds: row.startSeconds,
    audioPath,
    unavailableReason: !audioPath
      ? "Missing authorized audio file."
      : !pathOk
        ? "Audio path is outside the approved catalog directory."
        : undefined,
  };
}

const allTracks = ((churchCatalog.tracks ?? []) as ChurchTrackRow[]).map(mapRow);

function visibleTracks() {
  return allTracks.filter((track) => storyMusicTestTrackVisible(track.id));
}

export const churchAuthorizedAudioProvider: StoryMusicProvider = {
  kind: "church_authorized",

  listAttachableTracks() {
    return visibleTracks().filter((track) => track.playability === "playable");
  },

  findTrackById(trackId: string) {
    const id = trackId.trim();
    if (!id) return null;
    return visibleTracks().find((track) => track.id === id) ?? null;
  },

  search(filters: StoryMusicSearchFilters) {
    const limit = filters.limit ?? 32;
    let rows = visibleTracks();
    if (filters.attachableOnly) {
      rows = rows.filter((track) => track.playability === "playable");
    }
    return rows.filter((track) => matchesStoryMusicSearch(track, filters)).slice(0, limit);
  },

  async resolvePlayback(track: StoryMusicTrackRecord, origin: string): Promise<StoryMusicPlaybackPlan> {
    const startSeconds =
      typeof track.startSeconds === "number" && track.startSeconds >= 0
        ? Math.floor(track.startSeconds)
        : null;

    if (
      !storyMusicTestTrackVisible(track.id) ||
      track.playability !== "playable" ||
      !track.audioPath?.trim() ||
      !isAllowedCatalogLocalAudioPath(track.audioPath)
    ) {
      return {
        trackId: track.id,
        playability: "unavailable",
        mode: "unavailable",
        startSeconds,
        title: track.title,
        artist: track.artist,
        provider: track.provider,
        unavailableReason: track.unavailableReason ?? "Authorized audio is not available.",
      };
    }

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
  },
};
