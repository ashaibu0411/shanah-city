import { findCommunityStoryMusicTrack, searchCommunityStoryMusic } from "@/lib/community-story-music";
import { storyMusicHybridEnabled } from "@/lib/story-music/story-music-config";
import { churchAuthorizedAudioProvider } from "@/lib/story-music/providers/church-authorized-audio-provider";
import { legacyCatalogProvider } from "@/lib/story-music/providers/legacy-catalog-provider";
import { licensedCatalogProviderStub } from "@/lib/story-music/providers/licensed-catalog-provider.stub";
import type {
  StoryMusicPlaybackPlan,
  StoryMusicSearchFilters,
  StoryMusicTrackRecord,
} from "@/lib/story-music/types";
import type { CommunityStoryMusicTrack } from "@/lib/community-story-music";

const hybridProviders = [
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

export function searchStoryMusicTracks(filters: StoryMusicSearchFilters): CommunityStoryMusicTrack[] {
  if (!storyMusicHybridEnabled()) {
    return searchCommunityStoryMusic(filters.query ?? "", filters.limit ?? 32, filters.region);
  }

  const merged = new Map<string, StoryMusicTrackRecord>();
  for (const provider of hybridProviders) {
    for (const track of provider.search({ ...filters, attachableOnly: true })) {
      if (track.playability === "playable") merged.set(track.id, track);
    }
  }

  return [...merged.values()].map(toCommunityTrackShape);
}

export function findStoryMusicTrack(trackId: string): StoryMusicTrackRecord | null {
  if (!storyMusicHybridEnabled()) {
    const legacy = findCommunityStoryMusicTrack(trackId);
    if (!legacy) return null;
    return legacyCatalogProvider.findTrackById(legacy.id);
  }

  for (const provider of hybridProviders) {
    const hit = provider.findTrackById(trackId);
    if (hit) return hit;
  }
  return null;
}

export async function resolveStoryMusicPlayback(
  trackId: string,
  origin: string,
): Promise<StoryMusicPlaybackPlan | null> {
  const track = findStoryMusicTrack(trackId);
  if (!track) return null;

  if (!storyMusicHybridEnabled()) {
    const { resolveLegacyStoryMusicPlayback } = await import("@/lib/story-music/legacy-playback-bridge");
    return resolveLegacyStoryMusicPlayback(trackId, origin);
  }

  for (const provider of hybridProviders) {
    const owned = provider.findTrackById(trackId);
    if (owned) return provider.resolvePlayback(owned, origin);
  }
  return null;
}

export function assertTrackAttachable(trackId: string): { ok: true; track: StoryMusicTrackRecord } | { ok: false; error: string } {
  const track = findStoryMusicTrack(trackId);
  if (!track) {
    return { ok: false, error: "That song is not in the story music library." };
  }
  if (!storyMusicHybridEnabled()) {
    return { ok: true, track };
  }
  if (track.playability !== "playable" || track.provider === "legacy_catalog") {
    return {
      ok: false,
      error: "This song cannot be attached until authorized playback is available. Use preview to confirm.",
    };
  }
  return { ok: true, track };
}
