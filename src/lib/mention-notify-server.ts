import {
  formatMentionsForDisplay,
  parseMentions,
} from "@/lib/mentions";
import {
  getAllMemberIdsForMentionAll,
  getGroupMemberIds,
} from "@/lib/mention-server";
import { sendPushToUsers } from "@/lib/push-server";

export async function resolveMentionRecipientIds(input: {
  content: string;
  authorId: string;
  groupId?: string;
  extraUserIds?: string[];
}): Promise<string[]> {
  const parsed = parseMentions(input.content);
  const ids = new Set<string>();

  for (const userId of parsed.userIds) {
    if (userId && userId !== input.authorId) {
      ids.add(userId);
    }
  }

  if (parsed.mentionsAll) {
    const pool = input.groupId
      ? await getGroupMemberIds(input.groupId, input.authorId)
      : await getAllMemberIdsForMentionAll(input.authorId);
    for (const userId of pool) {
      ids.add(userId);
    }
  }

  for (const userId of input.extraUserIds ?? []) {
    if (userId && userId !== input.authorId) {
      ids.add(userId);
    }
  }

  return [...ids];
}

export async function notifyMemberMentions(input: {
  authorId: string;
  authorName: string;
  content: string;
  url: string;
  contextLabel: string;
  groupId?: string;
  preferenceKey?: "messages" | "groupChat" | "announcements";
}) {
  const recipientIds = await resolveMentionRecipientIds({
    content: input.content,
    authorId: input.authorId,
    groupId: input.groupId,
  });

  if (recipientIds.length === 0) return;

  const preview = formatMentionsForDisplay(input.content).trim().slice(0, 140);
  const body = preview || input.contextLabel;

  await sendPushToUsers(
    recipientIds,
    {
      title: `${input.authorName} mentioned you`,
      body,
      url: input.url,
    },
    input.preferenceKey ?? "announcements",
  );
}
