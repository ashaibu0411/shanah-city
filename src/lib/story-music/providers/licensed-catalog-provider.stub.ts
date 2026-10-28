import type {
  StoryMusicPlaybackPlan,
  StoryMusicProvider,
  StoryMusicSearchFilters,
  StoryMusicTrackRecord,
} from "@/lib/story-music/types";

/**
 * Placeholder for a contracted B2B music API (Epidemic, Artlist, etc.).
 * Returns no tracks until credentials and legal approval are configured.
 */
export const licensedCatalogProviderStub: StoryMusicProvider = {
  kind: "licensed_catalog",

  listAttachableTracks() {
    return [];
  },

  findTrackById() {
    return null;
  },

  search() {
    return [];
  },

  async resolvePlayback(track: StoryMusicTrackRecord, _origin: string): Promise<StoryMusicPlaybackPlan> {
    return {
      trackId: track.id,
      playability: "unavailable",
      mode: "unavailable",
      startSeconds: null,
      title: track.title,
      artist: track.artist,
      provider: track.provider,
      unavailableReason: "Licensed catalog not configured.",
    };
  },
};

export function licensedCatalogConfigured() {
  return Boolean(process.env.STORY_MUSIC_LICENSED_PROVIDER?.trim());
}
