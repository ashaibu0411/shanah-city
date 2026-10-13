import musicCatalog from "../../data/community-story-music.json";

export type CommunityStoryMusicTrack = {
  id: string;
  title: string;
  artist: string;
  youtubeVideoId: string;
  tags?: string[];
};

const tracks = (musicCatalog.tracks ?? []) as CommunityStoryMusicTrack[];

export function listCommunityStoryMusicTracks() {
  return tracks;
}

export function findCommunityStoryMusicTrack(trackId: string) {
  const id = trackId.trim();
  if (!id) return null;
  return tracks.find((track) => track.id === id) ?? null;
}

export function searchCommunityStoryMusic(query: string, limit = 24) {
  const q = query.trim().toLowerCase();
  if (!q) {
    return tracks.slice(0, limit);
  }

  return tracks
    .filter((track) => {
      const haystack = `${track.title} ${track.artist} ${(track.tags ?? []).join(" ")}`.toLowerCase();
      return haystack.includes(q);
    })
    .slice(0, limit);
}
