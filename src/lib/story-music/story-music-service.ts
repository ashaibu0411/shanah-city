import { findCommunityStoryMusicTrack, searchCommunityStoryMusic } from "@/lib/community-story-music";
import type { PublicMember } from "@/lib/auth-types";
import {
  storyMusicDbCatalogEnabled,
  storyMusicHybridEnabled,
  storyMusicProductionPilotEnabled,
} from "@/lib/story-music/story-music-config";
import { churchAuthorizedAudioProvider } from "@/lib/story-music/providers/church-authorized-audio-provider";
import { legacyCatalogProvider } from "@/lib/story-music/providers/legacy-catalog-provider";
import { licensedCatalogProviderStub } from "@/lib/story-music/providers/licensed-catalog-provider.stub";
import {
  findDbCatalogTrackById,
  searchDbCatalogTracks,
} from "@/lib/story-music/story-music-db-catalog";
import { canUseFreeWorshipMusic } from "@/lib/story-music/story-music-pilot-access";
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

type Viewer = Pick<PublicMember, "id" | "email"> | null | undefined;

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

function isChurchAuthorizedPlayableTrack(track: StoryMusicTrackRecord | null): track is StoryMusicTrackRecord {
  return Boolean(
    track &&
      track.provider === "church_authorized" &&
      track.playability === "playable" &&
      track.audioPath?.trim(),
  );
}

/** Global hybrid flag (env). Prefer session-aware helper in API routes. */
export function isStoryMusicHybridActive() {
  return storyMusicHybridEnabled();
}

export async function isStoryMusicHybridActiveForViewer(viewer?: Viewer): Promise<boolean> {
  if (storyMusicHybridEnabled()) return true;
  if (storyMusicProductionPilotEnabled() && (await canUseFreeWorshipMusic(viewer))) return true;
  return false;
}

async function isPilotScopedHybridOnly(viewer?: Viewer): Promise<boolean> {
  return !storyMusicHybridEnabled() && (await isStoryMusicHybridActiveForViewer(viewer));
}

async function resolveLegacyPlayback(trackId: string, origin: string) {
  const { resolveLegacyStoryMusicPlayback } = await import("@/lib/story-music/legacy-playback-bridge");
  return resolveLegacyStoryMusicPlayback(trackId, origin);
}

export async function searchStoryMusicTracks(
  filters: StoryMusicSearchFilters,
  viewerCountry?: string | null,
  viewer?: Viewer,
): Promise<CommunityStoryMusicTrack[]> {
  const hybridForViewer = await isStoryMusicHybridActiveForViewer(viewer);
  if (!hybridForViewer) {
    return searchCommunityStoryMusic(filters.query ?? "", filters.limit ?? 32, filters.region);
  }

  if (await isPilotScopedHybridOnly(viewer)) {
    const rows = churchAuthorizedAudioProvider.search({ ...filters, attachableOnly: true });
    return rows.filter((t) => t.playability === "playable").map(toCommunityTrackShape);
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
  viewer?: Viewer,
): Promise<StoryMusicTrackRecord | null> {
  const hybridForViewer = await isStoryMusicHybridActiveForViewer(viewer);

  if (await isPilotScopedHybridOnly(viewer)) {
    const authorized = churchAuthorizedAudioProvider.findTrackById(trackId);
    if (authorized) return authorized;
    const legacy = findCommunityStoryMusicTrack(trackId);
    if (!legacy) return null;
    return legacyCatalogProvider.findTrackById(legacy.id);
  }

  if (!hybridForViewer) {
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
  viewer?: Viewer,
): Promise<StoryMusicPlaybackPlan | null> {
  if (await isPilotScopedHybridOnly(viewer)) {
    const authorized = churchAuthorizedAudioProvider.findTrackById(trackId);
    if (isChurchAuthorizedPlayableTrack(authorized)) {
      return churchAuthorizedAudioProvider.resolvePlayback(authorized, origin);
    }
    return resolveLegacyPlayback(trackId, origin);
  }

  const track = await findStoryMusicTrack(trackId, viewerCountry, viewer);
  if (!track) return null;

  if (!(await isStoryMusicHybridActiveForViewer(viewer))) {
    return resolveLegacyPlayback(trackId, origin);
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
  viewer?: Viewer,
): Promise<{ ok: true; track: StoryMusicTrackRecord } | { ok: false; error: string }> {
  const track = await findStoryMusicTrack(trackId, viewerCountry, viewer);
  if (!track) {
    return { ok: false, error: "That song is not in the story music library." };
  }
  if (viewer !== undefined) {
    const { viewerCanAccessStoryMusicTrack } = await import(
      "@/lib/story-music/story-music-pilot-access"
    );
    if (!(await viewerCanAccessStoryMusicTrack(viewer, track))) {
      return {
        ok: false,
        error: "Free worship music is not available for your account yet.",
      };
    }
  }

  const hybridForViewer = await isStoryMusicHybridActiveForViewer(viewer);
  if (!hybridForViewer) {
    return { ok: true, track };
  }

  if (await isPilotScopedHybridOnly(viewer)) {
    if (!isChurchAuthorizedPlayableTrack(track)) {
      return { ok: false, error: "That song is not in the story music library." };
    }
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

/** Stream route: use hybrid blob/local delivery for this track + viewer. */
export async function shouldUseHybridStoryMusicStream(
  trackId: string,
  viewer?: Viewer,
): Promise<{ useHybrid: boolean; track: StoryMusicTrackRecord | null }> {
  if (storyMusicHybridEnabled()) {
    const track = await findStoryMusicTrack(trackId, null, viewer);
    return { useHybrid: Boolean(track && track.playability === "playable"), track };
  }
  if (await isPilotScopedHybridOnly(viewer)) {
    const track = churchAuthorizedAudioProvider.findTrackById(trackId);
    if (isChurchAuthorizedPlayableTrack(track)) {
      return { useHybrid: true, track };
    }
    return { useHybrid: false, track: null };
  }
  return { useHybrid: false, track: null };
}
