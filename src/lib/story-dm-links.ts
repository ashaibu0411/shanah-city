const STORY_MARKER = /\[\[story:([a-zA-Z0-9_-]+)\]\]/g;

export function buildStoryDmContent(text: string, statusId: string) {
  const trimmed = text.trim();
  const marker = `[[story:${statusId}]]`;
  if (trimmed.includes(marker)) return trimmed;
  return `${trimmed}\n${marker}`;
}

export function extractStoryIdFromChatContent(text: string): string | null {
  const match = text.match(/\[\[story:([a-zA-Z0-9_-]+)\]\]/);
  return match?.[1] ?? null;
}

export function stripStoryMarkerFromChatContent(text: string) {
  return text.replace(STORY_MARKER, "").trim();
}

export function communityStoryDeepLink(statusId: string) {
  return `/community?story=${encodeURIComponent(statusId)}`;
}

/** Story reply / reaction DMs hide the large preview after this age. */
export const STORY_DM_EMBED_TTL_MS = 24 * 60 * 60 * 1000;

export function storyDmEmbedExpired(messageCreatedAt: string | Date) {
  const created =
    typeof messageCreatedAt === "string" ? new Date(messageCreatedAt).getTime() : messageCreatedAt.getTime();
  if (!Number.isFinite(created)) return false;
  return Date.now() - created > STORY_DM_EMBED_TTL_MS;
}

const TRAILING_EMOJI =
  /([\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\u200D]+)$/u;

export function parseStoryDmReplyPresentation(text: string) {
  const trimmed = stripStoryMarkerFromChatContent(text).trim();
  const reacted = trimmed.match(/^Reacted\s+(\S+)\s+\(([^)]+)\)\s+to your story/i);
  if (reacted) {
    return {
      kind: "reaction" as const,
      emoji: reacted[1],
      summary: reacted[2]?.trim() || reacted[1],
    };
  }

  const replied = trimmed.match(/^Replied to your story:\s*(.+)$/i);
  if (replied) {
    const body = replied[1].trim();
    const emojiMatch = body.match(TRAILING_EMOJI);
    return {
      kind: "reply" as const,
      emoji: emojiMatch?.[1] ?? null,
      summary: body,
    };
  }

  return {
    kind: "other" as const,
    emoji: null,
    summary: trimmed,
  };
}
