import type {
  StoryMusicGenre,
  StoryMusicSearchFilters,
  StoryMusicTrackRecord,
} from "@/lib/story-music/types";

export const STORY_MUSIC_DISCOVERY_COUNTRIES: { code: string; label: string }[] = [
  { code: "all", label: "All countries" },
  { code: "GH", label: "Ghana" },
  { code: "NG", label: "Nigeria" },
  { code: "ZA", label: "South Africa" },
  { code: "KE", label: "Kenya" },
  { code: "JM", label: "Caribbean (JM)" },
  { code: "US", label: "United States" },
  { code: "MX", label: "Latin America (MX)" },
  { code: "GB", label: "UK / Europe" },
  { code: "KR", label: "Asia (KR)" },
];

export const STORY_MUSIC_DISCOVERY_LANGUAGES: { code: string; label: string }[] = [
  { code: "all", label: "All languages" },
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
  { code: "ko", label: "Korean" },
];

/** Primary picker filters for hybrid / free worship library search. */
export const STORY_MUSIC_PICKER_CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "Discover" },
  { id: "modern_worship", label: "Modern worship" },
  { id: "afrogospel", label: "Afrogospel" },
  { id: "youth_gospel", label: "Youth & upbeat" },
  { id: "global_worship", label: "Global worship" },
  { id: "traditional_gospel", label: "Classic & traditional" },
  { id: "instrumentals", label: "Instrumentals" },
];

type StoryMusicStyleTrack = { title: string; artist: string; genres?: readonly string[]; tags?: readonly string[]; country?: string };

/**
 * Conservative curation: an old hymn recorded by a band is not modern music
 * merely because legacy import metadata says "contemporary_christian".
 * This classifies the recordings already authorized for Stories. It never
 * infers recording permissions or changes what a member can play.
 */
export function isStoryMusicClassic(
  track: StoryMusicStyleTrack,
): boolean {
  const genres = track.genres ?? [];
  const tags = (track.tags ?? []).map((tag) => tag.toLowerCase());
  if (tags.includes("classic-style") || tags.includes("traditional_gospel") || tags.includes("traditional-gospel")) return true;
  if (genres.includes("hymn") || tags.includes("hymn") || tags.includes("hymns")) return true;
  return /(?:19[0-9]{2}|18[0-9]{2}|military|air force|u\.?s\.?a\.?f|navy band|coast guard|fisk|jubilee|quartet|battle hymn|thomas tallis|collegium vocale|edison|singing sergeants|rock of ages)/i.test(
    `${track.title} ${track.artist}`,
  );
}

export function isStoryMusicContemporary(
  track: StoryMusicStyleTrack,
): boolean {
  if (isStoryMusicClassic(track)) return false;
  const tags = (track.tags ?? []).map((tag) => tag.toLowerCase());
  const genres = track.genres ?? [];
  return (
    genres.includes("contemporary_christian") ||
    tags.includes("modern-worship") ||
    tags.includes("contemporary_christian") ||
    tags.includes("african_gospel") ||
    tags.includes("afrogospel") ||
    tags.includes("youth-gospel")
  );
}

/** Modern recordings first; within a group preserve the catalog's order. */
export function rankStoryMusicForDiscovery<T extends StoryMusicStyleTrack>(
  tracks: T[],
): T[] {
  const rank = (t: T) => isStoryMusicContemporary(t) ? 0 : isStoryMusicClassic(t) ? 2 : 1;
  return [...tracks].sort((a, b) => rank(a) - rank(b));
}

/** @deprecated Use STORY_MUSIC_PICKER_CATEGORIES in the member picker UI. */
export const STORY_MUSIC_DISCOVERY_GENRES: { id: string; label: string }[] = [
  { id: "all", label: "All genres" },
  { id: "gospel", label: "Gospel" },
  { id: "worship", label: "Worship" },
  { id: "contemporary_christian", label: "Contemporary Christian" },
  { id: "hymn", label: "Hymns" },
  { id: "instrumental", label: "Instrumental" },
];

function trackIsInstrumentalOnly(track: StoryMusicTrackRecord): boolean {
  const genres = track.genres ?? [];
  const tags = (track.tags ?? []).map((t) => t.toLowerCase());
  if (genres.includes("instrumental")) return true;
  return tags.some((t) => t === "instrumental-only" || t === "instrumental" || t.includes("instrumental-only"));
}

export function matchesStoryMusicPickerCategory(
  track: StoryMusicTrackRecord,
  pickerCategory: string | undefined,
): boolean {
  const id = pickerCategory?.trim();
  if (!id || id === "all") return true;

  const genres = track.genres ?? [];
  const tags = (track.tags ?? []).map((t) => t.toLowerCase());
  const instrumentalOnly = trackIsInstrumentalOnly(track);

  if (id === "instrumentals") return instrumentalOnly;
  if (id === "modern_worship" || id === "contemporary_christian") {
    return !instrumentalOnly && isStoryMusicContemporary(track);
  }
  if (id === "afrogospel" || id === "african_gospel") {
    return !instrumentalOnly &&
      (tags.includes("afrogospel") || tags.includes("african_gospel") || tags.includes("african-gospel"));
  }
  if (id === "youth_gospel") {
    return !instrumentalOnly && !isStoryMusicClassic(track) &&
      (tags.includes("youth-gospel") || tags.includes("gospel-hip-hop") || tags.includes("gospel-afrobeats") || tags.includes("upbeat"));
  }
  if (id === "global_worship") {
    return !instrumentalOnly && !isStoryMusicClassic(track) &&
      (tags.includes("global-worship") || tags.includes("international-worship") ||
      (Boolean(track.country && track.country !== "US") &&
      (genres.includes("worship") || genres.includes("contemporary_christian"))));
  }

  if (instrumentalOnly) return false;

  if (id === "traditional_gospel") {
    return (
      isStoryMusicClassic(track) ||
      tags.includes("traditional_gospel") ||
      tags.includes("traditional-gospel") ||
      genres.includes("hymn") ||
      tags.includes("hymn") ||
      tags.includes("spiritual") ||
      tags.includes("traditional-gospel") ||
      /spiritual|jubilee|quartet|1909|negro spiritual/i.test(`${track.title} ${track.artist} ${tags.join(" ")}`)
    );
  }

  if (id === "gospel_worship_songs") {
    return (
      tags.includes("gospel_worship_songs") ||
      genres.some((g) =>
        (["gospel", "worship", "contemporary_christian"] as string[]).includes(g),
      ) ||
      tags.some((t) =>
        ["gospel", "worship", "praise", "christian", "contemporary", "free-library"].includes(t),
      )
    );
  }

  if (id === "gospel_choirs") {
    return (
      tags.includes("gospel_choirs") ||
      tags.includes("gospel-choirs") ||
      /choir|quartet|sergeants|chanters|jubilee singers/i.test(`${track.title} ${track.artist} ${tags.join(" ")}`)
    );
  }

  return true;
}

function trackMatchesRegion(track: StoryMusicTrackRecord, region: string) {
  if (!region || region === "all") return true;
  const tags = (track.tags ?? []).map((tag) => tag.toLowerCase());
  return tags.includes(region.toLowerCase());
}

export function matchesStoryMusicSearch(
  track: StoryMusicTrackRecord,
  filters: StoryMusicSearchFilters,
): boolean {
  if (filters.region && !trackMatchesRegion(track, filters.region)) return false;

  const country = filters.country?.trim();
  if (country && country !== "all" && track.country?.toUpperCase() !== country.toUpperCase()) {
    return false;
  }

  const language = filters.language?.trim();
  if (language && language !== "all" && track.language?.toLowerCase() !== language.toLowerCase()) {
    return false;
  }

  const pickerCategory = filters.pickerCategory?.trim();
  if (pickerCategory && pickerCategory !== "all") {
    if (!matchesStoryMusicPickerCategory(track, pickerCategory)) return false;
  }

  const genre = filters.genre?.trim();
  if (genre && genre !== "all") {
    const genres = track.genres ?? [];
    if (!genres.includes(genre as StoryMusicGenre)) return false;
  }

  const q = filters.query?.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    track.title,
    track.artist,
    track.country ?? "",
    track.language ?? "",
    ...(track.genres ?? []),
    ...(track.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}
