import type { GroupResourceRecord } from "@/lib/group-resource-types";
import type { ChurchEvent } from "@/lib/types";

export const COUPLES_COMMUNITY_BOOKMARK_KEY = "shanah-couples-community-bookmarks";

export const COUPLES_DISCUSSION_TOPICS = [
  "Marriage in Real Life",
  "Date Night Ideas",
  "Faith & Family",
  "Busy Seasons",
] as const;

export function couplesCommunityTopicForPost(postId: string) {
  let hash = 0;
  for (let i = 0; i < postId.length; i += 1) {
    hash = (hash + postId.charCodeAt(i)) % COUPLES_DISCUSSION_TOPICS.length;
  }
  return COUPLES_DISCUSSION_TOPICS[hash] ?? COUPLES_DISCUSSION_TOPICS[0];
}

export const COUPLES_DISCUSSION_STARTERS = [
  "What's one thing that has strengthened your marriage this year?",
  "What is your favorite affordable date night idea?",
  "How do you make time for each other during busy weeks?",
] as const;

export type CouplesDiscussionCategoryId = "discussion" | "question" | "prayer" | "celebration";

export const COUPLES_DISCUSSION_CATEGORIES: {
  id: CouplesDiscussionCategoryId;
  label: string;
  postType: "general" | "prayer" | "praise";
  placeholder: string;
}[] = [
  {
    id: "discussion",
    label: "Discussion",
    postType: "general",
    placeholder: "Share an idea or story with other couples…",
  },
  {
    id: "question",
    label: "Question",
    postType: "general",
    placeholder: "Ask the community — we're in this together…",
  },
  {
    id: "prayer",
    label: "Prayer",
    postType: "prayer",
    placeholder: "How can we pray with you?",
  },
  {
    id: "celebration",
    label: "Celebration",
    postType: "praise",
    placeholder: "Celebrate a win in your marriage…",
  },
];

export function readCouplesCommunityBookmarks(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(COUPLES_COMMUNITY_BOOKMARK_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(list);
  } catch {
    return new Set();
  }
}

export function writeCouplesCommunityBookmarks(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COUPLES_COMMUNITY_BOOKMARK_KEY, JSON.stringify([...ids]));
}

export function parseCouplesEventDay(event: ChurchEvent): Date | null {
  const raw = event.startsOn?.trim() || event.date?.trim();
  if (!raw) return null;
  const parsed = new Date(`${raw}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatCouplesEventDate(event: ChurchEvent) {
  const day = parseCouplesEventDay(event);
  if (!day) return event.date || "Date TBA";
  return day.toLocaleDateString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
  });
}

export function eventImageUrl(event: ChurchEvent) {
  return event.artworkWideUrl || event.artworkSquareUrl || event.artworkBannerUrl || "";
}

export function resourceCategoryLabel(category: string) {
  const normalized = category.trim().toLowerCase();
  if (!normalized || normalized === "general") return "Resource";
  if (normalized === "video") return "Video";
  if (normalized === "teaching") return "Teaching";
  if (normalized === "devotional") return "Devotional";
  if (normalized === "guide") return "Discussion guide";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function groupResourcesByCategory(resources: GroupResourceRecord[]) {
  const map = new Map<string, GroupResourceRecord[]>();
  for (const resource of resources) {
    const key = resourceCategoryLabel(resource.category);
    const list = map.get(key) ?? [];
    list.push(resource);
    map.set(key, list);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}
