import type { ChatMessageReply } from "@/lib/chat-reply-types";
import { buildChatMessageReply, normalizeReplyExcerpt } from "@/lib/chat-reply-utils";

type ReplyRecord = {
  replyToMessageId?: string | null;
  replyToSenderId?: string | null;
  replyToSenderName?: string | null;
  replyToExcerpt?: string | null;
};

export function replyFromStoredRecord(record: ReplyRecord): ChatMessageReply | undefined {
  const messageId = String(record.replyToMessageId ?? "").trim();
  const senderId = String(record.replyToSenderId ?? "").trim();
  const senderName = String(record.replyToSenderName ?? "").trim();
  const excerpt = String(record.replyToExcerpt ?? "").trim();
  if (!messageId || !senderId || !senderName || !excerpt) return undefined;
  return { messageId, senderId, senderName, excerpt: normalizeReplyExcerpt(excerpt) };
}

export function replyToDbFields(reply?: ChatMessageReply | null) {
  if (!reply) {
    return {
      replyToMessageId: null,
      replyToSenderId: null,
      replyToSenderName: null,
      replyToExcerpt: null,
    };
  }
  return {
    replyToMessageId: reply.messageId,
    replyToSenderId: reply.senderId,
    replyToSenderName: reply.senderName,
    replyToExcerpt: reply.excerpt,
  };
}

export function resolveReplyForOutgoingMessage<T extends {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  deletedAt?: string | Date | null;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
}>(
  messages: T[],
  replyToMessageId?: string | null,
  excerptOverride?: string | null,
): ChatMessageReply | undefined {
  const targetId = String(replyToMessageId ?? "").trim();
  if (!targetId) return undefined;

  const target = messages.find((message) => message.id === targetId);
  if (!target) {
    throw new Error("The message you are replying to was not found.");
  }

  const deletedAt =
    target.deletedAt instanceof Date
      ? target.deletedAt.toISOString()
      : target.deletedAt ?? null;

  return buildChatMessageReply({
    messageId: target.id,
    senderId: target.senderId,
    senderName: target.senderName,
    content: target.content,
    deletedAt,
    attachmentName: target.attachmentName,
    attachmentUrl: target.attachmentUrl,
    excerptOverride: excerptOverride ?? undefined,
  });
}
