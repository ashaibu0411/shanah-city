export type MentionMember = {
  id: string;
  name: string;
  subtitle?: string;
};

export const MENTION_ALL_ID = "all";

/** Stored in message/post text; label is the display name at tag time. */
export const MENTION_TOKEN_PATTERN =
  /@\[([^\]]+)\]\(mention:([^)]+)\)/g;

export function formatMentionToken(name: string, userId: string) {
  const label = name.trim().replace(/[\[\]]/g, "") || "Member";
  return `@[${label}](mention:${userId})`;
}

export function formatMentionAllToken() {
  return `@[Everyone](mention:${MENTION_ALL_ID})`;
}

export type ParsedMentions = {
  userIds: string[];
  mentionsAll: boolean;
};

export function parseMentions(text: string): ParsedMentions {
  const userIds = new Set<string>();
  let mentionsAll = false;
  const pattern = new RegExp(MENTION_TOKEN_PATTERN.source, MENTION_TOKEN_PATTERN.flags);
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const id = match[2]?.trim() ?? "";
    if (id === MENTION_ALL_ID) {
      mentionsAll = true;
    } else if (id) {
      userIds.add(id);
    }
  }
  return { userIds: [...userIds], mentionsAll };
}

export function formatMentionsForDisplay(text: string) {
  return text.replace(
    new RegExp(MENTION_TOKEN_PATTERN.source, MENTION_TOKEN_PATTERN.flags),
    (_, label: string) => `@${label}`,
  );
}

export function splitTextWithMentionTokens(text: string) {
  type Part =
    | { type: "text"; value: string }
    | { type: "mention"; label: string; userId: string };
  const parts: Part[] = [];
  const pattern = new RegExp(MENTION_TOKEN_PATTERN.source, MENTION_TOKEN_PATTERN.flags);
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    parts.push({
      type: "mention",
      label: match[1] ?? "Member",
      userId: match[2] ?? "",
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }
  return parts.length > 0 ? parts : [{ type: "text" as const, value: text }];
}

export function filterMentionMembers(members: MentionMember[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return members.slice(0, 12);
  }
  return members
    .filter((member) => member.name.toLowerCase().includes(normalized))
    .slice(0, 12);
}

export function findActiveMentionQuery(value: string, cursor: number) {
  const before = value.slice(0, cursor);
  const atIndex = before.lastIndexOf("@");
  if (atIndex === -1) return null;
  const charBefore = atIndex > 0 ? before[atIndex - 1] : " ";
  if (!/\s|[([{'"`]/.test(charBefore) && atIndex !== 0) {
    return null;
  }
  const query = before.slice(atIndex + 1);
  if (query.includes("\n") || query.includes("(")) return null;
  return { atIndex, query };
}

export function insertMentionAt(
  value: string,
  atIndex: number,
  queryLength: number,
  token: string,
) {
  const before = value.slice(0, atIndex);
  const after = value.slice(atIndex + 1 + queryLength);
  const spacer = after.startsWith(" ") || after.length === 0 ? "" : " ";
  return `${before}${token}${spacer}${after}`;
}
