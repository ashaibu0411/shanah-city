import { loadAuthorizedProductionTrackRecords } from "@/lib/story-music/story-music-catalog-loader";
import type { PublicMember } from "@/lib/auth-types";
import {
  STORY_MUSIC_PRODUCTION_PILOT_TAG,
  STORY_MUSIC_STAGING_QA_TAG,
  storyMusicFreeLibraryEnabled,
  storyMusicHybridEnabled,
  storyMusicProductionPilotEnabled,
  storyMusicStagingQaLibraryEnabled,
} from "@/lib/story-music/story-music-config";
import {
  canUseFreeWorshipMusic,
  viewerCanAccessStoryMusicTrack,
} from "@/lib/story-music/story-music-pilot-access";

function isMemberFreeLibraryTrack(t: { playability: string; tags?: string[] }) {
  if (t.playability !== "playable") return false;
  const stagingQa = t.tags?.includes(STORY_MUSIC_STAGING_QA_TAG);
  if (stagingQa) return storyMusicStagingQaLibraryEnabled();
  const pilot = t.tags?.includes(STORY_MUSIC_PRODUCTION_PILOT_TAG);
  if (pilot) return false;
  return true;
}

export function countActiveFreeWorshipTracks() {
  return loadAuthorizedProductionTrackRecords().filter(isMemberFreeLibraryTrack).length;
}

function countPilotFreeTracksForViewer() {
  if (!storyMusicProductionPilotEnabled()) return 0;
  return loadAuthorizedProductionTrackRecords().filter(
    (t) =>
      t.playability === "playable" &&
      t.tags?.includes(STORY_MUSIC_PRODUCTION_PILOT_TAG),
  ).length;
}

/** Global member flag — false during admin-only production pilot. */
function freeLibraryInfrastructureEnabled() {
  if (!storyMusicFreeLibraryEnabled()) return false;
  return storyMusicHybridEnabled() || storyMusicProductionPilotEnabled();
}

export function isStoryMusicFreeLibraryLiveForMembers() {
  if (storyMusicProductionPilotEnabled()) return false;
  if (!freeLibraryInfrastructureEnabled()) return false;
  return countActiveFreeWorshipTracks() > 0;
}

/** Session-aware: pilot admins/QA only when production pilot is enabled. */
export async function isStoryMusicFreeLibraryLiveForViewer(
  user: Pick<PublicMember, "id" | "email"> | null | undefined,
) {
  if (!freeLibraryInfrastructureEnabled()) return false;

  if (storyMusicProductionPilotEnabled()) {
    if (!(await canUseFreeWorshipMusic(user))) return false;
    return countPilotFreeTracksForViewer() > 0;
  }

  return countActiveFreeWorshipTracks() > 0;
}

export async function countActiveFreeWorshipTracksForViewer(
  user: Pick<PublicMember, "id" | "email"> | null | undefined,
) {
  const tracks = loadAuthorizedProductionTrackRecords().filter((t) => t.playability === "playable");
  let n = 0;
  for (const track of tracks) {
    if (await viewerCanAccessStoryMusicTrack(user, track)) n += 1;
  }
  return n;
}
