import type { CouplesHubCommunityTileId, CouplesHubMarriageTileId } from "@/lib/couples-hub-types";

export type CouplesHubTileTone =
  | "calendar"
  | "date-night"
  | "love-notes"
  | "check-in"
  | "prayer"
  | "goals"
  | "devotionals"
  | "games"
  | "community";

export type CouplesHubTile = {
  id: CouplesHubMarriageTileId | CouplesHubCommunityTileId;
  title: string;
  subtitle: string;
  href: string;
  emoji: string;
  tone?: CouplesHubTileTone;
  requiresLink?: boolean;
};

export const couplesMarriageTiles: CouplesHubTile[] = [
  {
    id: "calendar",
    title: "Our calendar",
    subtitle: "Shared dates, anniversaries & appointments",
    href: "/couples/marriage/calendar",
    emoji: "📅",
    tone: "calendar",
    requiresLink: true,
  },
  {
    id: "date-night",
    title: "Date night",
    subtitle: "Ideas, plans & surprise invites",
    href: "/couples/marriage/date-night",
    emoji: "💕",
    tone: "date-night",
    requiresLink: true,
  },
  {
    id: "love-notes",
    title: "Love notes",
    subtitle: "Private encouragement for each other",
    href: "/couples/marriage/love-notes",
    emoji: "💌",
    tone: "love-notes",
    requiresLink: true,
  },
  {
    id: "check-in",
    title: "Check-ins",
    subtitle: "Weekly reflection & conversation prompts",
    href: "/couples/marriage/check-in",
    emoji: "🤝",
    tone: "check-in",
    requiresLink: true,
  },
  {
    id: "prayer-journal",
    title: "Prayer journal",
    subtitle: "Requests & answered prayers — just you two",
    href: "/couples/marriage/prayer",
    emoji: "🙏",
    tone: "prayer",
    requiresLink: true,
  },
  {
    id: "goals",
    title: "Our goals",
    subtitle: "Spiritual, family & marriage milestones",
    href: "/couples/marriage/goals",
    emoji: "🎯",
    tone: "goals",
    requiresLink: true,
  },
  {
    id: "devotionals",
    title: "Devotionals",
    subtitle: "Daily marriage reading & discussion",
    href: "/couples/marriage/devotionals",
    emoji: "📖",
    tone: "devotionals",
    requiresLink: true,
  },
  {
    id: "games",
    title: "Couples games",
    subtitle: "Fun prompts to grow closer",
    href: "/couples/marriage/games",
    emoji: "🎲",
    tone: "games",
    requiresLink: true,
  },
];

export const couplesCommunityTiles: CouplesHubTile[] = [
  {
    id: "discussions",
    title: "Discussions",
    subtitle: "Community feed & marriage conversations",
    href: "/community?group=group-shanah-power-couples",
    emoji: "💬",
  },
  {
    id: "events",
    title: "Couples events",
    subtitle: "Gatherings & church calendar",
    href: `/groups/group-shanah-power-couples?calendar=1`,
    emoji: "📣",
  },
  {
    id: "prayer",
    title: "Prayer community",
    subtitle: "Group prayer wall (leaders may support)",
    href: `/groups/group-shanah-power-couples?prayer=1`,
    emoji: "🕊️",
  },
  {
    id: "resources",
    title: "Resource library",
    subtitle: "Books, videos & worksheets",
    href: `/groups/group-shanah-power-couples?resources=1`,
    emoji: "📚",
  },
  {
    id: "challenges",
    title: "Marriage challenges",
    subtitle: "Growth track & mentor matching",
    href: `/groups/group-shanah-power-couples?growth=1`,
    emoji: "✨",
  },
  {
    id: "devotionals",
    title: "Marriage devotionals",
    subtitle: "Church devotion library for couples",
    href: "/devotions",
    emoji: "✦",
  },
  {
    id: "announcements",
    title: "Announcements",
    subtitle: "Power Couples group updates",
    href: `/groups/group-shanah-power-couples`,
    emoji: "📌",
  },
];
