import { listWorshipLibrarySongs } from "@/lib/worship-song-library-server";
import {
  mergePlanSongWithLibrary,
  type WorshipLibrarySong,
  type WorshipSong,
} from "@/lib/worship-types";

function libraryTitleKeys(entry: WorshipLibrarySong) {
  const keys = new Set<string>();
  const title = entry.title.trim().toLowerCase();
  if (title) keys.add(title);
  const artist = entry.artist?.trim();
  if (artist) {
    keys.add(`${title} - ${artist}`.toLowerCase());
    keys.add(`${title} – ${artist}`.toLowerCase());
  }
  return keys;
}

function matchLibraryEntry(song: WorshipSong, library: WorshipLibrarySong[]) {
  if (song.librarySongId) {
    return library.find((entry) => entry.id === song.librarySongId) ?? null;
  }

  const needle = song.title.trim().toLowerCase();
  if (!needle) return null;

  return (
    library.find((entry) => libraryTitleKeys(entry).has(needle)) ??
    library.find((entry) => entry.title.trim().toLowerCase() === needle) ??
    null
  );
}

/** Pull YouTube, charts, and lyrics from the worship song library onto plan rows. */
export async function enrichPlanSongsFromLibrary(songs: WorshipSong[]) {
  if (songs.length === 0) return songs;

  const library = await listWorshipLibrarySongs();
  if (library.length === 0) return songs;

  return songs.map((song) => {
    const entry = matchLibraryEntry(song, library);
    return entry ? mergePlanSongWithLibrary(song, entry) : song;
  });
}
