import type { DateNightIdeaCatalogItem, DateNightLocation } from "@/lib/couple-date-night-types";

export type DateNightTab = "ideas" | "dates" | "challenge";

export type DateNightIdeaCategory = {
  id: string;
  title: string;
  subtitle: string;
  iconBg: string;
  emoji: string;
  match: (item: DateNightIdeaCatalogItem) => boolean;
};

export const DATE_NIGHT_IDEA_CATEGORIES: DateNightIdeaCategory[] = [
  {
    id: "dinner",
    title: "Dinner & Conversation",
    subtitle: "Classic and meaningful",
    iconBg: "#F9E8E1",
    emoji: "🍷",
    match: (item) => item.locationType === "dining" || item.id === "dinner-talk",
  },
  {
    id: "home",
    title: "At-Home Date",
    subtitle: "Cozy and creative",
    iconBg: "#EDE6F5",
    emoji: "🏠",
    match: (item) => item.locationType === "home",
  },
  {
    id: "outdoor",
    title: "Outdoor Adventure",
    subtitle: "Explore together",
    iconBg: "#E3EDE5",
    emoji: "🌿",
    match: (item) => item.locationType === "outdoor" || item.locationType === "adventure",
  },
  {
    id: "faith",
    title: "Faith-Based Date",
    subtitle: "Pray, talk and grow",
    iconBg: "#F7F0DE",
    emoji: "✦",
    match: (item) => item.locationType === "faith",
  },
  {
    id: "surprise",
    title: "Surprise Me",
    subtitle: "Discover something unexpected",
    iconBg: "#EAD9BF",
    emoji: "✨",
    match: () => true,
  },
];

export type DateNightChallengeCard = {
  id: string;
  title: string;
  description: string;
  goal: number;
};

export const DATE_NIGHT_CURATED_CHALLENGES: DateNightChallengeCard[] = [
  {
    id: "appreciation-7",
    title: "Seven Days of Appreciation",
    description: "Share one specific thing you appreciate about your spouse each day.",
    goal: 7,
  },
  {
    id: "screen-free",
    title: "One Screen-Free Evening",
    description: "Put devices away for one full evening together.",
    goal: 1,
  },
  {
    id: "cook-together",
    title: "Cook Together",
    description: "Prepare a meal side by side — no rushing.",
    goal: 1,
  },
  {
    id: "twenty-questions",
    title: "Twenty Questions Night",
    description: "Ask curious questions and listen without fixing.",
    goal: 1,
  },
];

const CHALLENGE_STORAGE_KEY = "couples-date-night-challenge-progress";

export function readChallengeProgress(coupleLinkId: string): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(`${CHALLENGE_STORAGE_KEY}:${coupleLinkId}`);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

export function writeChallengeProgress(coupleLinkId: string, progress: Record<string, number>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${CHALLENGE_STORAGE_KEY}:${coupleLinkId}`, JSON.stringify(progress));
}

export function pickRandomCatalogItem(catalog: DateNightIdeaCatalogItem[]) {
  if (catalog.length === 0) return undefined;
  return catalog[Math.floor(Math.random() * catalog.length)];
}

export function catalogForCategory(
  categoryId: string,
  catalog: DateNightIdeaCatalogItem[],
): DateNightIdeaCatalogItem[] {
  const category = DATE_NIGHT_IDEA_CATEGORIES.find((entry) => entry.id === categoryId);
  if (!category || categoryId === "surprise") return catalog;
  return catalog.filter(category.match);
}

export function locationTypeForCategory(categoryId: string): DateNightLocation | undefined {
  switch (categoryId) {
    case "dinner":
      return "dining";
    case "home":
      return "home";
    case "outdoor":
      return "outdoor";
    case "faith":
      return "faith";
    default:
      return undefined;
  }
}
