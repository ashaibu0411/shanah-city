import type { CommunityStatusStoryKind } from "@/lib/member-types";

/** All reaction kinds stored in the database (includes legacy church reactions). */
export const COMMUNITY_STORY_REACTION_KINDS = [
  "laugh",
  "wow",
  "love",
  "sad",
  "clap",
  "fire",
  "coming",
  "heart",
  "pray",
  "amen",
] as const;

export type CommunityStoryReactionKind = (typeof COMMUNITY_STORY_REACTION_KINDS)[number];

export type CommunityStatusReactionCounts = Record<CommunityStoryReactionKind, number>;

export type StoryReactionButton = {
  kind: CommunityStoryReactionKind;
  label: string;
  emoji: string;
};

const REACTION_META: Record<
  CommunityStoryReactionKind,
  { label: string; emoji: string }
> = {
  laugh: { label: "Laugh", emoji: "😂" },
  wow: { label: "Wow", emoji: "😲" },
  love: { label: "Love", emoji: "😍" },
  sad: { label: "Sad", emoji: "😢" },
  clap: { label: "Clap", emoji: "👏" },
  fire: { label: "Fire", emoji: "🔥" },
  coming: { label: "I'm going", emoji: "🙋" },
  heart: { label: "Love", emoji: "❤️" },
  pray: { label: "Pray", emoji: "🙏" },
  amen: { label: "Amen", emoji: "🙌" },
};

/** Instagram-style quick reactions (full set of six). */
export const INSTAGRAM_QUICK_REACTION_KINDS = [
  "laugh",
  "wow",
  "love",
  "sad",
  "clap",
  "fire",
] as const satisfies readonly CommunityStoryReactionKind[];

/** Primary four shown in the compact quick row (matches common IG emphasis). */
export const INSTAGRAM_PRIMARY_QUICK_REACTION_KINDS = [
  "laugh",
  "wow",
  "love",
  "sad",
] as const satisfies readonly CommunityStoryReactionKind[];

const DEFAULT_STORY_REACTION_ORDER: CommunityStoryReactionKind[] = [
  ...INSTAGRAM_QUICK_REACTION_KINDS,
];

const SERVICE_INVITE_REACTION_ORDER: CommunityStoryReactionKind[] = [
  "coming",
  ...INSTAGRAM_QUICK_REACTION_KINDS,
];

export function emptyReactionCounts(): CommunityStatusReactionCounts {
  return {
    laugh: 0,
    wow: 0,
    love: 0,
    sad: 0,
    clap: 0,
    fire: 0,
    coming: 0,
    heart: 0,
    pray: 0,
    amen: 0,
  };
}

export function isStoryReactionKind(value: string): value is CommunityStoryReactionKind {
  return (COMMUNITY_STORY_REACTION_KINDS as readonly string[]).includes(value);
}

export function reactionMeta(kind: CommunityStoryReactionKind) {
  return REACTION_META[kind];
}

export function reactionButtonsForStory(
  storyKind: CommunityStatusStoryKind | undefined,
): StoryReactionButton[] {
  const order =
    storyKind === "service_invite" ? SERVICE_INVITE_REACTION_ORDER : DEFAULT_STORY_REACTION_ORDER;

  return order.map((kind) => {
    const meta = REACTION_META[kind];
    return { kind, label: meta.label, emoji: meta.emoji };
  });
}

/** Quick tray above reply — first four emojis, or five on service invites (I'm going + four). */
export function quickReactionButtonsForStory(
  storyKind: CommunityStatusStoryKind | undefined,
): StoryReactionButton[] {
  if (storyKind === "service_invite") {
    return [
      { kind: "coming", ...REACTION_META.coming },
      ...INSTAGRAM_PRIMARY_QUICK_REACTION_KINDS.map((kind) => ({
        kind,
        ...REACTION_META[kind],
      })),
    ];
  }

  return INSTAGRAM_PRIMARY_QUICK_REACTION_KINDS.map((kind) => ({
    kind,
    ...REACTION_META[kind],
  }));
}

/** Extra quick reactions (shown when reply field is focused — like Instagram with keyboard up). */
export function expandedQuickReactionButtonsForStory(
  storyKind: CommunityStatusStoryKind | undefined,
): StoryReactionButton[] {
  const extras: CommunityStoryReactionKind[] = ["clap", "fire"];
  return extras.map((kind) => ({ kind, ...REACTION_META[kind] }));
}

/** Full floating tray when the story reply field is focused (Instagram keyboard-up row). */
export function instagramFloatingQuickReactionButtonsForStory(
  storyKind: CommunityStatusStoryKind | undefined,
): StoryReactionButton[] {
  if (storyKind === "service_invite") {
    return [
      { kind: "coming", ...REACTION_META.coming },
      ...INSTAGRAM_QUICK_REACTION_KINDS.map((kind) => ({
        kind,
        ...REACTION_META[kind],
      })),
    ];
  }

  return INSTAGRAM_QUICK_REACTION_KINDS.map((kind) => ({
    kind,
    ...REACTION_META[kind],
  }));
}

/** Full list for author insights grouped sections. */
export function insightReactionButtonsForStory(
  storyKind: CommunityStatusStoryKind | undefined,
): StoryReactionButton[] {
  return reactionButtonsForStory(storyKind);
}

export function totalStoryReactionCount(
  reactions: Partial<CommunityStatusReactionCounts> | undefined,
) {
  if (!reactions) return 0;
  return COMMUNITY_STORY_REACTION_KINDS.reduce(
    (sum, kind) => sum + (reactions[kind] ?? 0),
    0,
  );
}

export function mergeReactionCounts(
  partial: Partial<CommunityStatusReactionCounts> | undefined,
): CommunityStatusReactionCounts {
  const base = emptyReactionCounts();
  if (!partial) return base;
  for (const kind of COMMUNITY_STORY_REACTION_KINDS) {
    base[kind] = partial[kind] ?? 0;
  }
  return base;
}
