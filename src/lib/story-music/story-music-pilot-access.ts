import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import {
  STORY_MUSIC_PRODUCTION_PILOT_TAG,
  STORY_MUSIC_STAGING_QA_TAG,
  storyMusicProductionPilotEnabled,
  storyMusicStagingQaLibraryEnabled,
} from "@/lib/story-music/story-music-config";
import type { StoryMusicTrackRecord } from "@/lib/story-music/types";
import type { CommunityStoryMusicTrack } from "@/lib/community-story-music";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function storyMusicPilotUserIds(): Set<string> {
  return new Set(
    (process.env.STORY_MUSIC_PILOT_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

export function storyMusicPilotEmails(): Set<string> {
  return new Set(
    (process.env.STORY_MUSIC_PILOT_EMAILS ?? "")
      .split(",")
      .map((email) => normalizeEmail(email))
      .filter(Boolean),
  );
}

/** Server gate: admin-only production pilot for Free Worship Music (not all members). */
export async function canUseFreeWorshipMusic(
  user: Pick<PublicMember, "id" | "email"> | null | undefined,
): Promise<boolean> {
  if (!user?.id) return false;
  if (!storyMusicProductionPilotEnabled()) return false;
  if (await canManageAsAdmin(user)) return true;
  if (storyMusicPilotUserIds().has(user.id)) return true;
  const email = user.email?.trim();
  if (email && storyMusicPilotEmails().has(normalizeEmail(email))) return true;
  return false;
}

export function trackRequiresPilotGate(track: { tags?: string[] | null } | null | undefined): boolean {
  const tags = track?.tags ?? [];
  return (
    tags.includes(STORY_MUSIC_PRODUCTION_PILOT_TAG) || tags.includes(STORY_MUSIC_STAGING_QA_TAG)
  );
}

export function trackVisibleInServerCatalog(row: { tags?: string[] }) {
  const tags = row.tags ?? [];
  if (tags.includes(STORY_MUSIC_STAGING_QA_TAG)) return storyMusicStagingQaLibraryEnabled();
  if (tags.includes(STORY_MUSIC_PRODUCTION_PILOT_TAG)) return storyMusicProductionPilotEnabled();
  return true;
}

export async function viewerCanAccessStoryMusicTrack(
  user: Pick<PublicMember, "id" | "email"> | null | undefined,
  track: StoryMusicTrackRecord | CommunityStoryMusicTrack | null,
): Promise<boolean> {
  if (!track) return false;
  if (!trackRequiresPilotGate(track)) return true;
  if (track.tags?.includes(STORY_MUSIC_STAGING_QA_TAG)) {
    if (!storyMusicStagingQaLibraryEnabled()) return false;
  }
  if (track.tags?.includes(STORY_MUSIC_PRODUCTION_PILOT_TAG)) {
    if (!storyMusicProductionPilotEnabled()) return false;
  }
  return canUseFreeWorshipMusic(user);
}

type StoryMusicAccessTrack = StoryMusicTrackRecord | CommunityStoryMusicTrack;

export async function filterStoryMusicTracksForViewer<T extends StoryMusicAccessTrack>(
  tracks: T[],
  user: Pick<PublicMember, "id" | "email"> | null | undefined,
): Promise<T[]> {
  const out: T[] = [];
  for (const track of tracks) {
    if (await viewerCanAccessStoryMusicTrack(user, track)) out.push(track);
  }
  return out;
}
