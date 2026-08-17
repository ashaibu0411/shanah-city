import { useDatabase } from "@/lib/use-database";
import * as worshipSongLibraryDb from "@/lib/stores/worship-song-library-db";
import * as worshipSongLibraryJson from "@/lib/stores/worship-song-library-json";

const store = () => (useDatabase() ? worshipSongLibraryDb : worshipSongLibraryJson);

export const listWorshipLibrarySongs = (query?: string) => store().listWorshipLibrarySongs(query);
export const getWorshipLibrarySong = (id: string) => store().getWorshipLibrarySong(id);
export const saveWorshipLibrarySong = (
  input: Parameters<typeof worshipSongLibraryJson.saveWorshipLibrarySong>[0],
) => store().saveWorshipLibrarySong(input);
export const incrementWorshipLibraryUseCount = (id: string) =>
  store().incrementWorshipLibraryUseCount(id);
export const deleteWorshipLibrarySong = (id: string) => store().deleteWorshipLibrarySong(id);
