import type { CommunityPost } from "@/lib/member-types";
import { communityPostDisplayParts, communityPostDisplayText } from "@/lib/community-ui-utils";

export type CommunityPostVisualType =
  | "prayer"
  | "praise"
  | "testimony"
  | "update"
  | "event"
  | "urgent";

export type CommunityPostDisplayContent = {
  title?: string;
  body: string;
};

const TESTIMONY_MARKER = /^\[testimony\]\s*/i;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function stripTestimonyMarker(content: string): string {
  return content.replace(TESTIMONY_MARKER, "");
}

export function postContentHasTestimonyMarker(content: string): boolean {
  return TESTIMONY_MARKER.test(content.trimStart());
}

/** Legacy posts often repeat the author at the start of the body; strip when it matches the header author. */
export function stripRepeatedLeadingAuthor(author: string, content: string): string {
  const body = content ?? "";
  if (!body.trim() || !author.trim()) return body;

  const trimmedStart = body.trimStart();
  const leadingSpace = body.length - trimmedStart.length;
  const names = [author.trim(), author.trim().split(/\s+/)[0] ?? ""].filter(
    (name, index, list) => name.length > 0 && list.indexOf(name) === index,
  );

  for (const name of names) {
    const pattern = new RegExp(
      `^${escapeRegExp(name)}(?:\\s*[:\\-—–|]\\s*|\\s+)`,
      "i",
    );
    if (pattern.test(trimmedStart)) {
      const stripped = trimmedStart.replace(pattern, "");
      return `${body.slice(0, leadingSpace)}${stripped}`;
    }
    if (trimmedStart.toLowerCase() === name.toLowerCase()) {
      return "";
    }
  }

  return body;
}

export function splitCommunityPostTitleBody(content: string): CommunityPostDisplayContent {
  const normalized = content.trim();
  if (!normalized) return { body: "" };

  const newlineIndex = normalized.indexOf("\n");
  if (newlineIndex === -1) {
    return { body: normalized };
  }

  const firstLine = normalized.slice(0, newlineIndex).trim();
  const remainder = normalized.slice(newlineIndex + 1).trim();
  if (firstLine && remainder && firstLine.length <= 140) {
    return { title: firstLine, body: remainder };
  }

  return { body: normalized };
}

export function prepareCommunityPostDisplay(
  author: string,
  content: string,
  options?: { announcement?: boolean },
): CommunityPostDisplayContent {
  const withoutMarker = stripTestimonyMarker(content);
  if (options?.announcement) {
    const parts = communityPostDisplayParts(withoutMarker, author, true);
    return {
      title: parts.headline || undefined,
      body: parts.body,
    };
  }
  const withoutAuthor = communityPostDisplayText(withoutMarker, author);
  return splitCommunityPostTitleBody(withoutAuthor);
}

export function communityPostVisualType(
  post: Pick<CommunityPost, "type" | "content">,
  options?: { isUrgentAlert?: boolean },
): CommunityPostVisualType {
  if (options?.isUrgentAlert) return "urgent";
  if (post.type === "prayer") return "prayer";
  if (post.type === "general") return "update";
  if (post.type === "announcement") return "event";
  if (post.type === "praise") {
    if (
      postContentHasTestimonyMarker(post.content) ||
      /\b(testimony|testified|what god did|share how god)\b/i.test(post.content)
    ) {
      return "testimony";
    }
    return "praise";
  }
  return "update";
}

export function communityPostVisualTypeLabel(type: CommunityPostVisualType): string {
  switch (type) {
    case "prayer":
      return "Prayer";
    case "praise":
      return "Praise";
    case "testimony":
      return "Testimony";
    case "update":
      return "Update";
    case "event":
      return "Event";
    case "urgent":
      return "Urgent alert";
    default:
      return "Update";
  }
}
