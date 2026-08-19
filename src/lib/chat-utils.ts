export type ChatMessageReaction = {
  emoji: string;
  userId: string;
  userName: string;
};

export type ChatMessageExtras = {
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  editedAt?: string;
  deletedAt?: string;
  readAt?: string;
  seenCount?: number;
};

export type ChatTypingUser = {
  userId: string;
  userName: string;
};

export const QUICK_CHAT_EMOJIS = [
  "👍",
  "❤️",
  "😂",
  "🙏",
  "🎉",
  "👏",
  "😊",
  "🔥",
  "✅",
  "🙌",
  "😮",
  "💯",
] as const;

export function normalizeChatReactions(reactions: ChatMessageReaction[] | undefined) {
  return (reactions ?? []).filter((reaction) => reaction.emoji && reaction.userId);
}

export function toggleChatReaction(
  reactions: ChatMessageReaction[] | undefined,
  emoji: string,
  user: { id: string; name: string },
) {
  const list = normalizeChatReactions(reactions);
  const exists = list.some(
    (reaction) => reaction.userId === user.id && reaction.emoji === emoji,
  );
  if (exists) {
    return list.filter(
      (reaction) => !(reaction.userId === user.id && reaction.emoji === emoji),
    );
  }
  return [...list, { emoji, userId: user.id, userName: user.name }];
}

export type ReactionSummary = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
  label: string;
};

export function summarizeChatReactions(
  reactions: ChatMessageReaction[] | undefined,
  currentUserId: string,
): ReactionSummary[] {
  const map = new Map<string, ReactionSummary>();

  for (const reaction of normalizeChatReactions(reactions)) {
    const existing = map.get(reaction.emoji);
    if (existing) {
      existing.count += 1;
      existing.reactedByMe = existing.reactedByMe || reaction.userId === currentUserId;
      if (!existing.label.includes(reaction.userName)) {
        existing.label = `${existing.label}, ${reaction.userName}`;
      }
    } else {
      map.set(reaction.emoji, {
        emoji: reaction.emoji,
        count: 1,
        reactedByMe: reaction.userId === currentUserId,
        label: reaction.userName,
      });
    }
  }

  return [...map.values()];
}

export function insertAtCursor(value: string, insertion: string, selectionStart: number, selectionEnd: number) {
  return `${value.slice(0, selectionStart)}${insertion}${value.slice(selectionEnd)}`;
}

export function isAllowedReactionEmoji(emoji: string) {
  const trimmed = emoji.trim();
  if (!trimmed || trimmed.length > 8) return false;
  return QUICK_CHAT_EMOJIS.includes(trimmed as (typeof QUICK_CHAT_EMOJIS)[number]) || trimmed.length <= 4;
}

export function isChatAttachmentRef(value?: string | null) {
  return Boolean(value?.startsWith("chat:"));
}

export function getChatAttachmentApiUrl(attachmentRef?: string | null) {
  if (!isChatAttachmentRef(attachmentRef)) return null;
  const id = attachmentRef!.slice("chat:".length);
  return `/api/chat/attachment?id=${encodeURIComponent(id)}`;
}

export function validateChatContent(content: string, hasAttachment: boolean) {
  const trimmed = content.trim();
  if (!trimmed && !hasAttachment) {
    throw new Error("Message cannot be empty.");
  }
  if (trimmed.length > 2000) {
    throw new Error("Message is too long (2000 characters max).");
  }
  return trimmed;
}

export function formatDeletedMessageContent(content: string, deletedAt?: string) {
  if (deletedAt) return "Message deleted";
  return content;
}
