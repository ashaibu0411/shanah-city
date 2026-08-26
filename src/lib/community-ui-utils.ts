import type { CommunityPost } from "@/lib/member-types";

export type CommunityFeedFilter = "all" | "prayer" | "praise" | "announcement";

export const COMMUNITY_FEED_FILTERS: Array<{ id: CommunityFeedFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "prayer", label: "Prayer" },
  { id: "praise", label: "Praise" },
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
  return "Amen";
}

export function reactionEmoji(type: CommunityPost["type"]) {
  if (type === "prayer") return "🙏";
  if (type === "announcement") return "📣";
  return "❤️";
}

export function postTypeLabel(type: CommunityPost["type"]) {
  if (type === "prayer") return "Prayer request";
  if (type === "announcement") return "Announcement";
  return "Praise report";
}

export function filterCommunityPosts(
  posts: CommunityPost[],
  filter: CommunityFeedFilter,
) {
  if (filter === "all") return posts;
  return posts.filter((post) => post.type === filter);
}
