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

export const STORY_MUSIC_DISCOVERY_GENRES: { id: string; label: string }[] = [
  { id: "all", label: "All genres" },
  { id: "gospel", label: "Gospel" },
  { id: "worship", label: "Worship" },
  { id: "contemporary_christian", label: "Contemporary Christian" },
  { id: "hymn", label: "Hymns" },
  { id: "instrumental", label: "Instrumental" },
];

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
