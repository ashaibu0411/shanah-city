import { loadAuthorizedProductionTrackRecords } from "@/lib/story-music/story-music-catalog-loader";
import {
  STORY_MUSIC_STAGING_QA_TAG,
  storyMusicFreeLibraryEnabled,
  storyMusicHybridEnabled,
  storyMusicStagingQaLibraryEnabled,
} from "@/lib/story-music/story-music-config";

export function countActiveFreeWorshipTracks() {
  return loadAuthorizedProductionTrackRecords().filter((t) => {
    if (t.playability !== "playable") return false;
    const stagingQa = t.tags?.includes(STORY_MUSIC_STAGING_QA_TAG);
    if (stagingQa) return storyMusicStagingQaLibraryEnabled();
    return true;
  }).length;
}

/** Member-facing free library: hybrid + flag + at least one verified published track. */
export function isStoryMusicFreeLibraryLiveForMembers() {
  if (!storyMusicHybridEnabled() || !storyMusicFreeLibraryEnabled()) return false;
  return countActiveFreeWorshipTracks() > 0;
}
