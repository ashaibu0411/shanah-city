import type { ChatMessageReply } from "@/lib/chat-reply-types";

const MAX_EXCERPT = 280;

export function normalizeReplyExcerpt(value: string) {
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (!collapsed) return "Message";
  if (collapsed.length <= MAX_EXCERPT) return collapsed;
  return `${collapsed.slice(0, MAX_EXCERPT - 1)}…`;
}

export function replyExcerptFromMessage(input: {
  content: string;
  deletedAt?: string | null;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
}) {
  if (input.deletedAt) {
    return "Message unsent";
  }
  const trimmed = input.content.trim();
  if (trimmed) return normalizeReplyExcerpt(trimmed);
  if (input.attachmentUrl) {
    return input.attachmentName?.trim() || "Photo";
  }
  return "Message";
}

export function buildChatMessageReply(input: {
  messageId: string;
  senderId: string;
  senderName: string;
  content: string;
  deletedAt?: string | null;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  excerptOverride?: string;
}): ChatMessageReply {
  const excerpt = input.excerptOverride?.trim()
    ? normalizeReplyExcerpt(input.excerptOverride)
    : replyExcerptFromMessage(input);

  return {
    messageId: input.messageId,
    senderId: input.senderId,
    senderName: input.senderName,
    excerpt,
  };
}

export function parseChatMessageReply(value: unknown): ChatMessageReply | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const messageId = String(record.messageId ?? "").trim();
  const senderId = String(record.senderId ?? "").trim();
  const senderName = String(record.senderName ?? "").trim();
  const excerpt = String(record.excerpt ?? "").trim();
  if (!messageId || !senderId || !senderName || !excerpt) return undefined;
  return { messageId, senderId, senderName, excerpt: normalizeReplyExcerpt(excerpt) };
}

export function scrollToChatMessage(messageId: string) {
  const element = document.getElementById(`chat-msg-${messageId}`);
  if (!element) return false;
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  element.classList.add("chat-msg-highlight");
  window.setTimeout(() => element.classList.remove("chat-msg-highlight"), 1800);
  return true;
}
