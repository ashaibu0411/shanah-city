import { loadAuthorizedProductionTrackRecords } from "@/lib/story-music/story-music-catalog-loader";
import {
  storyMusicFreeLibraryEnabled,
  storyMusicHybridEnabled,
} from "@/lib/story-music/story-music-config";

export function countActiveFreeWorshipTracks() {
  return loadAuthorizedProductionTrackRecords().filter((t) => t.playability === "playable").length;
}

/** Member-facing free library: hybrid + flag + at least one verified published track. */
export function isStoryMusicFreeLibraryLiveForMembers() {
  if (!storyMusicHybridEnabled() || !storyMusicFreeLibraryEnabled()) return false;
  return countActiveFreeWorshipTracks() > 0;
}
