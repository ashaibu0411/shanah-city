/** Provider that supplies playable audio for story background music. */
export type StoryMusicProviderKind = "church_authorized" | "licensed_catalog" | "legacy_catalog";

export type StoryMusicPlayability = "playable" | "unavailable";

export type StoryMusicGenre =
  | "gospel"
  | "worship"
  | "contemporary_christian"
  | "hymn"
  | "instrumental";

export type StoryMusicTrackRecord = {
  /** Stable id stored on CommunityStatus.musicTrackId (preserved across providers). */
  id: string;
  title: string;
  artist: string;
  provider: StoryMusicProviderKind;
  /** Provider-native id (Blob key, API track id, etc.). */
  providerTrackId: string;
  playability: StoryMusicPlayability;
  /** ISO 3166-1 alpha-2 or regional label (e.g. GH, NG, US). */
  country?: string;
  /** BCP-47 language tag when known (e.g. en, tw, yo, pt). */
  language?: string;
  genres?: StoryMusicGenre[];
  tags?: string[];
  startSeconds?: number;
  /** Legacy YouTube reference — metadata only in hybrid mode; not used for extraction. */
  youtubeVideoId?: string;
  /** Direct HTTPS audio when playability is playable. */
  audioPath?: string;
  unavailableReason?: string;
  licenseType?: string;
  licenseUrl?: string;
  attributionText?: string;
  sourceUrl?: string;
};

export type StoryMusicSearchFilters = {
  query?: string;
  country?: string;
  language?: string;
  genre?: string;
  /** Legacy region chip (maps to tags). */
  region?: string;
  limit?: number;
  /** When true, only tracks attachable in compose UI. */
  attachableOnly?: boolean;
};

export type StoryMusicPlaybackPlan = {
  trackId: string;
  playability: StoryMusicPlayability;
  mode: "audio" | "youtube" | "unavailable";
  audioUrl?: string;
  youtubeVideoId?: string;
  startSeconds?: number | null;
  title: string;
  artist: string;
  provider: StoryMusicProviderKind;
  unavailableReason?: string;
  licenseType?: string;
  licenseUrl?: string;
  attributionText?: string;
  sourceUrl?: string;
};

export type StoryMusicProvider = {
  kind: StoryMusicProviderKind;
  listAttachableTracks(): StoryMusicTrackRecord[];
  findTrackById(trackId: string): StoryMusicTrackRecord | null;
  search(filters: StoryMusicSearchFilters): StoryMusicTrackRecord[];
  resolvePlayback(
    track: StoryMusicTrackRecord,
    origin: string,
  ): Promise<StoryMusicPlaybackPlan>;
};
