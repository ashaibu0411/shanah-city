import { recordActivity } from "@/lib/auth-server";
import { isUserBlocked } from "@/lib/block-server";
import { buildStoryDmContent } from "@/lib/story-dm-links";
import { reactionMeta } from "@/lib/community-story-reactions";
import type { CommunityStoryReactionKind } from "@/lib/member-types";
import { prisma } from "@/lib/db";
import { sendDirectMessage } from "@/lib/message-server";
import { notifyNewMessage } from "@/lib/push-server";

export async function getStoryDmPreview(statusId: string) {
  const status = await prisma.communityStatus.findUnique({
    where: { id: statusId },
    select: {
      id: true,
      authorId: true,
      authorName: true,
      mediaUrl: true,
      mediaType: true,
      caption: true,
      expiresAt: true,
      createdAt: true,
    },
  });
  if (!status) return null;

  const expired = status.expiresAt <= new Date();
  return {
    id: status.id,
    authorId: status.authorId,
    authorName: status.authorName,
    mediaUrl: status.mediaUrl,
    mediaType: status.mediaType,
    caption: status.caption ?? "",
    expired,
    createdAt: status.createdAt.toISOString(),
  };
}

export async function notifyStoryReplyInDirectMessage(input: {
  statusId: string;
  senderId: string;
  senderName: string;
  replyText: string;
}) {
  const content = input.replyText.trim();
  if (!content) return;

  const status = await prisma.communityStatus.findUnique({
    where: { id: input.statusId },
    select: { authorId: true, authorName: true },
  });
  if (!status || status.authorId === input.senderId) return;
  if (await isUserBlocked(status.authorId, input.senderId)) return;

  const dmContent = buildStoryDmContent(`Replied to your story: ${content}`, input.statusId);

  try {
    const result = await sendDirectMessage({
      senderId: input.senderId,
      senderName: input.senderName,
      recipientId: status.authorId,
      recipientName: status.authorName,
      content: dmContent,
    });
    await recordActivity(input.senderId, "message_sent", `Messaged ${status.authorName}`);
    await notifyNewMessage({
      recipientId: status.authorId,
      senderName: input.senderName,
      preview: dmContent.slice(0, 120),
      threadId: result.thread.id,
    });
  } catch (error) {
    console.error("[story-reply] DM notify failed:", error);
  }
}

export async function notifyStoryReactionInDirectMessage(input: {
  statusId: string;
  senderId: string;
  senderName: string;
  kind: CommunityStoryReactionKind;
}) {
  const status = await prisma.communityStatus.findUnique({
    where: { id: input.statusId },
    select: { authorId: true, authorName: true },
  });
  if (!status || status.authorId === input.senderId) return;
  if (await isUserBlocked(status.authorId, input.senderId)) return;

  const { emoji, label } = reactionMeta(input.kind);
  const dmContent = buildStoryDmContent(
    `Reacted ${emoji} (${label}) to your story`,
    input.statusId,
  );

  try {
    const result = await sendDirectMessage({
      senderId: input.senderId,
      senderName: input.senderName,
      recipientId: status.authorId,
      recipientName: status.authorName,
      content: dmContent,
    });
    await recordActivity(input.senderId, "message_sent", `Messaged ${status.authorName}`);
    await notifyNewMessage({
      recipientId: status.authorId,
      senderName: input.senderName,
      preview: dmContent.slice(0, 120),
      threadId: result.thread.id,
    });
  } catch (error) {
    console.error("[story-reaction] DM notify failed:", error);
  }
}
