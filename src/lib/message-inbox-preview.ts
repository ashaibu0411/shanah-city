import type { DirectMessage } from "@/lib/member-types";
import { isChatAudioAttachment } from "@/lib/chat-utils";

/** Human-readable inbox / thread preview (no raw attachment URLs). */
export function messageInboxPreview(message: Pick<
  DirectMessage,
  | "content"
  | "deletedAt"
  | "reply"
  | "attachmentUrl"
  | "attachmentType"
  | "attachmentName"
  | "reactions"
>): string {
  if (message.deletedAt) return "Message unsent";

  const reactions = message.reactions ?? [];
  if (reactions.length > 0 && !message.content.trim() && !message.attachmentUrl) {
    const last = reactions[reactions.length - 1];
    return last?.emoji ? `Reacted ${last.emoji}` : "Reaction";
  }

  if (message.reply) {
    const body = message.content.trim() || "Reply";
    return `↩ ${body.slice(0, 100)}`;
  }

  if (message.attachmentUrl) {
    const type = (message.attachmentType ?? "").toLowerCase();
    const text = message.content.trim();
    if (isChatAudioAttachment(message.attachmentType, message.attachmentName)) {
      return text ? `🎤 ${text.slice(0, 80)}` : "Voice message";
    }
    if (type.startsWith("video/") || type === "video") {
      return text ? `🎬 ${text.slice(0, 80)}` : "Video";
    }
    if (type.startsWith("image/") || type === "image") {
      return text ? `📷 ${text.slice(0, 80)}` : "Photo";
    }
    if (text) return text.slice(0, 120);
    return message.attachmentName?.trim() || "Attachment";
  }

  const trimmed = message.content.trim();
  if (!trimmed) return "Message";
  if (/^https?:\/\//i.test(trimmed)) return "Link";
  return trimmed.slice(0, 120);
}
