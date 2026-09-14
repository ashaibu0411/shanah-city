import { getStoryCircleUserIds } from "@/lib/community-story-priority-server";
import { attachReactionsToStatuses } from "@/lib/community-status-reaction-server";
import {
  deleteExpiredCommunityStatuses,
  getActiveCommunityStatuses,
} from "@/lib/community-status-server";
import { notifyCommunityStory } from "@/lib/push-server";

export async function loadCommunityStatusesForViewer(viewerId?: string) {
  await deleteExpiredCommunityStatuses();
  const statuses = await getActiveCommunityStatuses();
  const enriched = await attachReactionsToStatuses(statuses, viewerId);
  const priorityAuthorIds = viewerId ? await getStoryCircleUserIds(viewerId) : [];
  return { statuses: enriched, priorityAuthorIds };
}

export async function notifyStoryPosted(input: {
  authorId: string;
  authorName: string;
  caption?: string;
}) {
  try {
    const recipientIds = await getStoryCircleUserIds(input.authorId);
    await notifyCommunityStory({
      authorId: input.authorId,
      authorName: input.authorName,
      caption: input.caption,
      recipientIds,
    });
  } catch {
    // Push should not block story publish.
  }
}

export type { CommunityStoryReactionKind } from "@/lib/member-types";