import type { WorshipLibrarySong, WorshipSong } from "@/lib/worship-types";

export function worshipSongThumbnailUrl(song: {
  youtubeVideoId?: string | null;
}): string | null {
  const id = song.youtubeVideoId?.trim();
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

export function setlistSongResources(song: WorshipSong) {
  return {
    hasLyrics: Boolean(song.lyrics?.trim()),
    hasChords: Boolean(song.chartUrl?.trim()),
    hasAudio: Boolean(
      song.youtubeVideoId?.trim() ||
        (song.practiceStems ?? []).some((stem) => stem.status === "approved" && stem.audioUrl),
    ),
  };
}

export function librarySongResources(song: WorshipLibrarySong) {
  return {
    hasLyrics: Boolean(song.lyrics?.trim()),
    hasChords: Boolean(song.chartUrl?.trim()),
    hasAudio: Boolean(song.youtubeVideoId?.trim()),
  };
}
