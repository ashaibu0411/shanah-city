import type { WorshipSong } from "@/lib/worship-types";
import { incrementWorshipLibraryUseCount } from "@/lib/worship-song-library-server";

export async function trackLibrarySongUsage(songs: WorshipSong[]) {
  const librarySongIds = [
    ...new Set(songs.map((song) => song.librarySongId).filter(Boolean)),
  ] as string[];

  await Promise.all(librarySongIds.map((id) => incrementWorshipLibraryUseCount(id)));
}
