import {
  addCommunityStatus,
  deleteActiveLiveStatusesForAuthor,
  deleteCommunityStatus,
} from "@/lib/community-status-server";
import { createStoryLiveRoomName } from "@/lib/livekit-server";

const LIVE_STORY_HOURS = 4;

function liveStoryExpiry() {
  return new Date(Date.now() + LIVE_STORY_HOURS * 60 * 60 * 1000);
}

export async function startCommunityStoryLive(input: {
  authorId: string;
  authorName: string;
  caption?: string;
}) {
  await deleteActiveLiveStatusesForAuthor(input.authorId);
  const roomName = createStoryLiveRoomName(input.authorId);
  const status = await addCommunityStatus({
    id: `status-live-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    authorId: input.authorId,
    authorName: input.authorName,
    mediaUrl: roomName,
    mediaType: "live",
    caption: input.caption?.trim() || "Live now",
    storyKind: "default",
    expiresAt: liveStoryExpiry(),
  });

  return { status, roomName };
}

export async function endCommunityStoryLive(input: { statusId: string; authorId: string }) {
  return deleteCommunityStatus({ id: input.statusId, authorId: input.authorId });
}
