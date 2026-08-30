import type { CommunityStatus } from "@/lib/member-types";

export const STORY_IMAGE_MS = 5000;
export const SEEN_STORIES_STORAGE_KEY = "shanah-community-story-seen";

export type StoryDeck = {
  authorId: string;
  authorName: string;
  items: CommunityStatus[];
  previewItem: CommunityStatus;
  hasUnseen: boolean;
};

export function resolveStoryMediaUrl(url: string) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }
  if (typeof window !== "undefined") {
    try {
      return new URL(url, window.location.origin).toString();
    } catch {
      return url;
    }
  }
  return url;
}

export function loadSeenStoryIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_STORIES_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((entry): entry is string => typeof entry === "string"));
  } catch {
    return new Set();
  }
}

export function saveSeenStoryIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  const trimmed = [...ids].slice(-500);
  localStorage.setItem(SEEN_STORIES_STORAGE_KEY, JSON.stringify(trimmed));
}

export function markStoriesSeen(ids: string[], seen: Set<string>): Set<string> {
  const next = new Set(seen);
  for (const id of ids) next.add(id);
  saveSeenStoryIds(next);
  return next;
}

export function buildStoryDecks(
  statuses: CommunityStatus[],
  seenIds: Set<string>,
  currentUserId?: string,
): StoryDeck[] {
  const byAuthor = new Map<string, CommunityStatus[]>();

  for (const status of statuses) {
    const list = byAuthor.get(status.authorId) ?? [];
    list.push(status);
    byAuthor.set(status.authorId, list);
  }

  const decks: StoryDeck[] = [];

  for (const [authorId, items] of byAuthor) {
    const sorted = [...items].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const previewItem = sorted[sorted.length - 1];
    const hasUnseen =
      authorId !== currentUserId && sorted.some((item) => !seenIds.has(item.id));

    decks.push({
      authorId,
      authorName: previewItem.authorName,
      items: sorted,
      previewItem,
      hasUnseen,
    });
  }

  decks.sort((a, b) => {
    if (currentUserId) {
      if (a.authorId === currentUserId) return -1;
      if (b.authorId === currentUserId) return 1;
    }
    return (
      new Date(b.previewItem.createdAt).getTime() - new Date(a.previewItem.createdAt).getTime()
    );
  });

  return decks;
}

export function findDeckIndex(decks: StoryDeck[], authorId: string) {
  return decks.findIndex((deck) => deck.authorId === authorId);
}
