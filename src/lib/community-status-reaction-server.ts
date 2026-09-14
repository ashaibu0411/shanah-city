import { prisma } from "@/lib/db";
import type {
  CommunityStatus,
  CommunityStatusReactionCounts,
  CommunityStoryReactionKind,
} from "@/lib/member-types";

export const COMMUNITY_STORY_REACTION_KINDS = ["pray", "coming", "amen"] as const;

export function emptyReactionCounts(): CommunityStatusReactionCounts {
  return { pray: 0, coming: 0, amen: 0 };
}

function isReactionKind(value: string): value is CommunityStoryReactionKind {
  return (COMMUNITY_STORY_REACTION_KINDS as readonly string[]).includes(value);
}

export async function attachReactionsToStatuses(
  statuses: CommunityStatus[],
  viewerId?: string,
): Promise<
  (CommunityStatus & {
    reactions: CommunityStatusReactionCounts;
    viewerReactions: CommunityStoryReactionKind[];
  })[]
> {
  if (statuses.length === 0) {
    return [];
  }

  const statusIds = statuses.map((status) => status.id);
  const records = await prisma.communityStatusReaction.findMany({
    where: { statusId: { in: statusIds } },
  });

  const countsByStatus = new Map<string, CommunityStatusReactionCounts>();
  const viewerByStatus = new Map<string, CommunityStoryReactionKind[]>();

  for (const record of records) {
    if (!isReactionKind(record.kind)) continue;
    const counts = countsByStatus.get(record.statusId) ?? emptyReactionCounts();
    counts[record.kind] += 1;
    countsByStatus.set(record.statusId, counts);

    if (viewerId && record.userId === viewerId) {
      const list = viewerByStatus.get(record.statusId) ?? [];
      if (!list.includes(record.kind)) {
        list.push(record.kind);
      }
      viewerByStatus.set(record.statusId, list);
    }
  }

  return statuses.map((status) => ({
    ...status,
    reactions: countsByStatus.get(status.id) ?? emptyReactionCounts(),
    viewerReactions: viewerByStatus.get(status.id) ?? [],
  }));
}

export async function toggleCommunityStatusReaction(input: {
  statusId: string;
  userId: string;
  kind: CommunityStoryReactionKind;
}) {
  const status = await prisma.communityStatus.findUnique({
    where: { id: input.statusId },
  });
  if (!status || status.expiresAt <= new Date()) {
    throw new Error("Story not found.");
  }
  if (status.authorId === input.userId) {
    throw new Error("You cannot react to your own story.");
  }

  const existing = await prisma.communityStatusReaction.findFirst({
    where: {
      statusId: input.statusId,
      userId: input.userId,
      kind: input.kind,
    },
  });

  if (existing) {
    await prisma.communityStatusReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.communityStatusReaction.create({
      data: {
        id: `sr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        statusId: input.statusId,
        userId: input.userId,
        kind: input.kind,
      },
    });
  }

  const records = await prisma.communityStatusReaction.findMany({
    where: { statusId: input.statusId },
  });

  const reactions = emptyReactionCounts();
  const viewerReactions: CommunityStoryReactionKind[] = [];

  for (const record of records) {
    if (!isReactionKind(record.kind)) continue;
    reactions[record.kind] += 1;
    if (record.userId === input.userId && !viewerReactions.includes(record.kind)) {
      viewerReactions.push(record.kind);
    }
  }

  return { reactions, viewerReactions };
}
