import type { CommunityPost } from "@/lib/member-types";

export type CommunityFeedFilter = "all" | "prayer" | "praise" | "general" | "announcement";

export type CommunityMemberPostType = "prayer" | "praise" | "general";

/** Prayer, praise, or everyday community updates (shown as "Update" in the UI). */
export const COMMUNITY_SHARE_POST_TYPES: Array<{ id: CommunityMemberPostType; label: string }> = [
  { id: "prayer", label: "Prayer" },
  { id: "praise", label: "Praise" },
  { id: "general", label: "Update" },
];

export const COMMUNITY_FEED_FILTERS: Array<{ id: CommunityFeedFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "prayer", label: "Prayer" },
  { id: "praise", label: "Praise" },
  { id: "general", label: "Updates" },
  { id: "announcement", label: "News" },
];

export function formatCommunityTimeAgo(iso?: string, fallback?: string) {
  if (!iso) return fallback ?? "Just now";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fallback ?? "Just now";

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function authorInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function reactionActionLabel(type: CommunityPost["type"]) {
  if (type === "prayer") return "Pray";
  if (type === "announcement") return "Noted";
  if (type === "general") return "Like";
  return "Amen";
}

export function reactionEmoji(type: CommunityPost["type"]) {
  if (type === "prayer") return "🙏";
  if (type === "announcement") return "📣";
  if (type === "general") return "👍";
  return "❤️";
}

export function postTypeLabel(type: CommunityPost["type"]) {
  if (type === "prayer") return "Prayer request";
  if (type === "announcement") return "Announcement";
  if (type === "general") return "Update";
  return "Praise report";
}

export function filterCommunityPosts(
  posts: CommunityPost[],
  filter: CommunityFeedFilter,
) {
  if (filter === "all") return posts;
  return posts.filter((post) => post.type === filter);
}

/**
 * Remove a duplicated author prefix on older posts only when it is clearly a
 * label. Never mutate the persisted message or strip ordinary prose.
 */
export function communityPostDisplayText(content: string, author: string): string {
  const cleanAuthor = author.trim();
  if (!cleanAuthor) return content;
  const leading = content.match(/^\s*/)?.[0] ?? "";
  const rest = content.slice(leading.length);
  if (rest.slice(0, cleanAuthor.length).toLocaleLowerCase() !== cleanAuthor.toLocaleLowerCase()) {
    return content;
  }
  const suffix = rest.slice(cleanAuthor.length);
  const separator = suffix.match(/^\s*[:|—–-]\s*/);
  const announcementPrefix = suffix.match(/^\s+(?=(?:urgent|announcement|news|update|alert)\b)/i);
  if (!separator && !announcementPrefix) return content;
  return suffix.slice((separator ?? announcementPrefix)![0].length).trimStart();
}

/** A short headline is visual emphasis only; the full post remains in place. */
export function communityPostDisplayParts(content: string, author: string, announcement: boolean) {
  const display = communityPostDisplayText(content, author);
  if (!announcement) return { headline: "", body: display };
  const match = display.match(/^([^\n]{4,85})\n\s*\n([\s\S]+)/);
  if (!match) return { headline: "", body: display };
  return { headline: match[1].trim(), body: match[2].trimStart() };
}
