import musicCatalog from "../../data/community-story-music.json";

export type CommunityStoryMusicRegion = "global" | "nigeria" | "ghana" | "gospel";

export type CommunityStoryMusicTrack = {
  id: string;
  title: string;
  artist: string;
  youtubeVideoId: string;
  tags?: string[];
  /** Optional hook start (seconds) for story playback. */
  startSeconds?: number;
};

const tracks = (musicCatalog.tracks ?? []) as CommunityStoryMusicTrack[];

export const COMMUNITY_STORY_MUSIC_REGIONS: {
  id: CommunityStoryMusicRegion | "all";
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "global", label: "Global worship" },
  { id: "nigeria", label: "Nigeria" },
  { id: "ghana", label: "Ghana" },
  { id: "gospel", label: "Gospel classics" },
];

export function listCommunityStoryMusicTracks() {
  return tracks;
}

export function findCommunityStoryMusicTrack(trackId: string) {
  const id = trackId.trim();
  if (!id) return null;
  return tracks.find((track) => track.id === id) ?? null;
}

function trackMatchesRegion(track: CommunityStoryMusicTrack, region: string) {
  if (!region || region === "all") return true;
  const tags = (track.tags ?? []).map((tag) => tag.toLowerCase());
  return tags.includes(region.toLowerCase());
}

export function searchCommunityStoryMusic(
  query: string,
  limit = 32,
  region?: string,
) {
  const q = query.trim().toLowerCase();
  const byRegion = tracks.filter((track) => trackMatchesRegion(track, region ?? "all"));

  if (!q) {
    return byRegion.slice(0, limit);
  }

  return byRegion
    .filter((track) => {
      const haystack = `${track.title} ${track.artist} ${(track.tags ?? []).join(" ")}`.toLowerCase();
      return haystack.includes(q);
    })
    .slice(0, limit);
}
