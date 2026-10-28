import { findCommunityStoryMusicTrack, searchCommunityStoryMusic } from "@/lib/community-story-music";
import {
  storyMusicDbCatalogEnabled,
  storyMusicHybridEnabled,
} from "@/lib/story-music/story-music-config";
import { churchAuthorizedAudioProvider } from "@/lib/story-music/providers/church-authorized-audio-provider";
import { legacyCatalogProvider } from "@/lib/story-music/providers/legacy-catalog-provider";
import { licensedCatalogProviderStub } from "@/lib/story-music/providers/licensed-catalog-provider.stub";
import {
  findDbCatalogTrackById,
  searchDbCatalogTracks,
} from "@/lib/story-music/story-music-db-catalog";
import type {
  StoryMusicPlaybackPlan,
  StoryMusicSearchFilters,
  StoryMusicTrackRecord,
} from "@/lib/story-music/types";
import type { CommunityStoryMusicTrack } from "@/lib/community-story-music";

const jsonHybridProviders = [
  churchAuthorizedAudioProvider,
  licensedCatalogProviderStub,
  legacyCatalogProvider,
];

function toCommunityTrackShape(track: StoryMusicTrackRecord): CommunityStoryMusicTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    youtubeVideoId: track.youtubeVideoId ?? "",
    tags: track.tags,
    startSeconds: track.startSeconds,
    audioUrl: track.audioPath,
    playability: track.playability,
    country: track.country,
    language: track.language,
    genres: track.genres,
    provider: track.provider,
  };
}

export function isStoryMusicHybridActive() {
  return storyMusicHybridEnabled();
}

export async function searchStoryMusicTracks(
  filters: StoryMusicSearchFilters,
  viewerCountry?: string | null,
): Promise<CommunityStoryMusicTrack[]> {
  if (!storyMusicHybridEnabled()) {
    return searchCommunityStoryMusic(filters.query ?? "", filters.limit ?? 32, filters.region);
  }

  if (storyMusicDbCatalogEnabled()) {
    const tracks = await searchDbCatalogTracks({ ...filters, attachableOnly: true }, viewerCountry);
    return tracks.map(toCommunityTrackShape);
  }

  const merged = new Map<string, StoryMusicTrackRecord>();
  for (const provider of jsonHybridProviders) {
    for (const track of provider.search({ ...filters, attachableOnly: true })) {
      if (track.playability === "playable") merged.set(track.id, track);
    }
  }
  return [...merged.values()].map(toCommunityTrackShape);
}

export async function findStoryMusicTrack(
  trackId: string,
  viewerCountry?: string | null,
): Promise<StoryMusicTrackRecord | null> {
  if (!storyMusicHybridEnabled()) {
    const legacy = findCommunityStoryMusicTrack(trackId);
    if (!legacy) return null;
    return legacyCatalogProvider.findTrackById(legacy.id);
  }

  if (storyMusicDbCatalogEnabled()) {
    const dbHit = await findDbCatalogTrackById(trackId, viewerCountry);
    if (dbHit) return dbHit;
  }

  for (const provider of jsonHybridProviders) {
    const hit = provider.findTrackById(trackId);
    if (hit) return hit;
  }
  return null;
}

export async function resolveStoryMusicPlayback(
  trackId: string,
  origin: string,
  viewerCountry?: string | null,
): Promise<StoryMusicPlaybackPlan | null> {
  const track = await findStoryMusicTrack(trackId, viewerCountry);
  if (!track) return null;

  if (!storyMusicHybridEnabled()) {
    const { resolveLegacyStoryMusicPlayback } = await import("@/lib/story-music/legacy-playback-bridge");
    return resolveLegacyStoryMusicPlayback(trackId, origin);
  }

  if (storyMusicDbCatalogEnabled()) {
    return resolveDbOrProviderPlayback(track, origin, trackId);
  }

  for (const provider of jsonHybridProviders) {
    const owned = provider.findTrackById(trackId);
    if (owned) return provider.resolvePlayback(owned, origin);
  }
  return null;
}

async function resolveDbOrProviderPlayback(
  track: StoryMusicTrackRecord,
  origin: string,
  trackId: string,
): Promise<StoryMusicPlaybackPlan> {
  const startSeconds =
    typeof track.startSeconds === "number" && track.startSeconds >= 0
      ? Math.floor(track.startSeconds)
      : null;

  if (track.playability !== "playable" || !track.audioPath?.trim()) {
    return {
      trackId,
      playability: "unavailable",
      mode: "unavailable",
      startSeconds,
      title: track.title,
      artist: track.artist,
      provider: track.provider,
      unavailableReason: track.unavailableReason ?? "Audio unavailable.",
    };
  }

  const audioUrl = `${origin.replace(/\/$/, "")}/api/community/story-music/stream?trackId=${encodeURIComponent(trackId)}`;
  return {
    trackId,
    playability: "playable",
    mode: "audio",
    audioUrl,
    startSeconds,
    title: track.title,
    artist: track.artist,
    provider: track.provider,
  };
}

export async function assertTrackAttachable(
  trackId: string,
  viewerCountry?: string | null,
): Promise<{ ok: true; track: StoryMusicTrackRecord } | { ok: false; error: string }> {
  const track = await findStoryMusicTrack(trackId, viewerCountry);
  if (!track) {
    return { ok: false, error: "That song is not in the story music library." };
  }
  if (!storyMusicHybridEnabled()) {
    return { ok: true, track };
  }
  if (track.playability !== "playable") {
    return {
      ok: false,
      error: "This song cannot be attached until authorized playback is available. Use preview to confirm.",
    };
  }
  if (track.provider === "legacy_catalog" && !track.audioPath?.trim()) {
    return { ok: false, error: "Legacy track pending authorized audio mapping." };
  }
  if (track.provider === "licensed_catalog") {
    return { ok: false, error: "Licensed catalog is not configured." };
  }
  return { ok: true, track };
}
