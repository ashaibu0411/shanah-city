import {
  COMMUNITY_STORY_REACTION_KINDS,
  emptyReactionCounts,
  reactionMeta,
  type CommunityStoryReactionKind,
} from "@/lib/community-story-reactions";

/** Emoji reactions on feed posts (stories share kinds; no service-invite "coming"). */
export const COMMUNITY_POST_REACTION_KINDS = COMMUNITY_STORY_REACTION_KINDS.filter(
  (kind) => kind !== "coming",
) as Exclude<CommunityStoryReactionKind, "coming">[];

export type CommunityPostReactionKind = (typeof COMMUNITY_POST_REACTION_KINDS)[number];

export type PostReactionInsight = {
  userId: string;
  name: string;
  kind: CommunityPostReactionKind;
  createdAt: string;
};

export type CommunityPostReactionCounts = Record<CommunityPostReactionKind, number>;

export function emptyPostReactionCounts(): CommunityPostReactionCounts {
  const all = emptyReactionCounts();
  const counts = {} as CommunityPostReactionCounts;
  for (const kind of COMMUNITY_POST_REACTION_KINDS) {
    counts[kind] = all[kind];
  }
  return counts;
}

export function isPostReactionKind(value: string): value is CommunityPostReactionKind {
  return (COMMUNITY_POST_REACTION_KINDS as readonly string[]).includes(value);
}

export function postReactionButtons() {
  return COMMUNITY_POST_REACTION_KINDS.map((kind) => ({
    kind,
    ...reactionMeta(kind),
  }));
}

export function totalPostReactionCount(
  counts: Partial<CommunityPostReactionCounts> | undefined,
  legacyTotal?: number,
) {
  if (counts) {
    return COMMUNITY_POST_REACTION_KINDS.reduce((sum, kind) => sum + (counts[kind] ?? 0), 0);
  }
  return legacyTotal ?? 0;
}

export function topPostReactionEmojis(
  counts: Partial<CommunityPostReactionCounts> | undefined,
  limit = 3,
) {
  if (!counts) return [];
  return COMMUNITY_POST_REACTION_KINDS.filter((kind) => (counts[kind] ?? 0) > 0)
    .sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))
    .slice(0, limit)
    .map((kind) => reactionMeta(kind).emoji);
}
