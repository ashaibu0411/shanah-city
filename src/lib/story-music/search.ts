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
  { id: "all", label: "All categories" },
  { id: "gospel_worship_songs", label: "Gospel & Worship Songs" },
  { id: "contemporary_christian", label: "Contemporary Christian" },
  { id: "african_gospel", label: "African Gospel" },
  { id: "traditional_gospel", label: "Traditional Gospel" },
  { id: "gospel_choirs", label: "Gospel Choirs" },
  { id: "instrumentals", label: "Instrumentals" },
];

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

  if (instrumentalOnly) return false;

  if (id === "traditional_gospel") {
    return (
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

  if (id === "contemporary_christian") {
    return (
      tags.includes("gospel_worship_songs") ||
      genres.includes("contemporary_christian") ||
      tags.includes("contemporary_christian")
    );
  }

  if (id === "african_gospel") {
    return tags.includes("african_gospel") || tags.includes("african-gospel");
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
