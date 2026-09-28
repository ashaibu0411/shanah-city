import { getUsers } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import type { GroupChatMessage } from "@/lib/group-types";
import type { ChatMessageReaction } from "@/lib/chat-utils";
import { getPublicDisplayName } from "@/lib/member-display-name";
import type {
  Comment,
  CommunityPost,
  CommunityStatus,
  DirectMessage,
  MessageThread,
} from "@/lib/member-types";
import { useDatabase } from "@/lib/use-database";

export function displayNameForUserId(
  nameById: Map<string, string>,
  userId: string | undefined | null,
  storedName: string,
) {
  if (userId && nameById.has(userId)) {
    return nameById.get(userId)!;
  }
  return storedName;
}

export async function buildPublicDisplayNameMap(userIds: Iterable<string>) {
  const ids = [...new Set([...userIds].filter(Boolean))];
  const map = new Map<string, string>();
  if (ids.length === 0) return map;

  if (useDatabase()) {
    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, displayName: true },
    });
    for (const user of users) {
      map.set(user.id, getPublicDisplayName(user));
    }
    return map;
  }

  const users = await getUsers();
  for (const id of ids) {
    const user = users.find((entry) => entry.id === id);
    if (user) {
      map.set(id, getPublicDisplayName(user));
    }
  }
  return map;
}

function collectCommentUserIds(comments: Comment[], ids: Set<string>) {
  for (const comment of comments) {
    if (comment.authorId) ids.add(comment.authorId);
    if (comment.replies?.length) {
      collectCommentUserIds(comment.replies, ids);
    }
  }
}

export function collectCommunityPostUserIds(posts: CommunityPost[]) {
  const ids = new Set<string>();
  for (const post of posts) {
    if (post.authorId) ids.add(post.authorId);
    collectCommentUserIds(post.comments ?? [], ids);
  }
  return [...ids];
}

function mapCommentsWithDisplayNames(comments: Comment[], nameById: Map<string, string>): Comment[] {
  return comments.map((comment) => ({
    ...comment,
    author: displayNameForUserId(nameById, comment.authorId, comment.author),
    replies: comment.replies?.length
      ? mapCommentsWithDisplayNames(comment.replies, nameById)
      : comment.replies,
  }));
}

export function applyDisplayNamesToCommunityPosts(
  posts: CommunityPost[],
  nameById: Map<string, string>,
): CommunityPost[] {
  return posts.map((post) => ({
    ...post,
    author: displayNameForUserId(nameById, post.authorId, post.author),
    comments: mapCommentsWithDisplayNames(post.comments ?? [], nameById),
  }));
}

export async function resolveDisplayNamesForCommunityPosts(posts: CommunityPost[]) {
  const nameById = await buildPublicDisplayNameMap(collectCommunityPostUserIds(posts));
  return applyDisplayNamesToCommunityPosts(posts, nameById);
}

export function applyDisplayNamesToCommunityStatuses(
  statuses: CommunityStatus[],
  nameById: Map<string, string>,
): CommunityStatus[] {
  return statuses.map((status) => ({
    ...status,
    authorName: displayNameForUserId(nameById, status.authorId, status.authorName),
  }));
}

export async function resolveDisplayNamesForCommunityStatuses(statuses: CommunityStatus[]) {
  const nameById = await buildPublicDisplayNameMap(statuses.map((status) => status.authorId));
  return applyDisplayNamesToCommunityStatuses(statuses, nameById);
}

export function applyDisplayNamesToThread(
  thread: MessageThread,
  nameById: Map<string, string>,
): MessageThread {
  const participantNames = { ...thread.participantNames };
  for (const id of thread.participantIds) {
    if (nameById.has(id)) {
      participantNames[id] = nameById.get(id)!;
    }
  }
  return { ...thread, participantNames };
}

function mapMessageReactions(
  reactions: ChatMessageReaction[] | undefined,
  nameById: Map<string, string>,
) {
  return (reactions ?? []).map((reaction) => ({
    ...reaction,
    userName: displayNameForUserId(nameById, reaction.userId, reaction.userName),
  }));
}

export function applyDisplayNamesToDirectMessage(
  message: DirectMessage,
  nameById: Map<string, string>,
): DirectMessage {
  return {
    ...message,
    senderName: displayNameForUserId(nameById, message.senderId, message.senderName),
    reactions: mapMessageReactions(message.reactions, nameById),
    reply: message.reply
      ? {
          ...message.reply,
          senderName: displayNameForUserId(
            nameById,
            message.reply.senderId,
            message.reply.senderName,
          ),
        }
      : message.reply,
  };
}

export function collectDirectMessageUserIds(messages: DirectMessage[], thread?: MessageThread) {
  const ids = new Set<string>();
  if (thread) {
    for (const id of thread.participantIds) ids.add(id);
  }
  for (const message of messages) {
    ids.add(message.senderId);
    for (const reaction of message.reactions ?? []) {
      ids.add(reaction.userId);
    }
    if (message.reply?.senderId) ids.add(message.reply.senderId);
  }
  return [...ids];
}

export function applyDisplayNamesToGroupChatMessage(
  message: GroupChatMessage,
  nameById: Map<string, string>,
): GroupChatMessage {
  return {
    ...message,
    senderName: displayNameForUserId(nameById, message.senderId, message.senderName),
    reactions: mapMessageReactions(message.reactions, nameById),
    reply: message.reply
      ? {
          ...message.reply,
          senderName: displayNameForUserId(
            nameById,
            message.reply.senderId,
            message.reply.senderName,
          ),
        }
      : message.reply,
  };
}

export function collectGroupChatMessageUserIds(messages: GroupChatMessage[]) {
  const ids = new Set<string>();
  for (const message of messages) {
    ids.add(message.senderId);
    for (const reaction of message.reactions ?? []) {
      ids.add(reaction.userId);
    }
    if (message.reply?.senderId) ids.add(message.reply.senderId);
  }
  return [...ids];
}
