import type { CoupleMarriageDevotionalView } from "@/lib/couple-marriage-devotional-types";

export type DevotionalsTab = "daily" | "plans" | "progress";

export const DEVOTIONAL_EXAMPLE_PREVIEW = {
  title: "Better Together",
  reference: "Ecclesiastes 4:9–12",
  preview:
    "Two are better than one, because they have a good return for their labor…",
  intro:
    "A short reflection on walking through life as partners — stronger side by side.",
};

export const COUPLES_DEVOTIONAL_READING_PLANS = [
  {
    id: "communication-7",
    title: "7 Days of Better Communication",
    durationDays: 7,
    coverGradient: "from-sky-100 to-blue-200",
    accent: "text-sky-900",
  },
  {
    id: "prayer-21",
    title: "21 Days of Praying Together",
    durationDays: 21,
    coverGradient: "from-amber-100 to-[var(--couples-gold-light)]",
    accent: "text-[var(--couples-mocha)]",
  },
  {
    id: "love-30",
    title: "30 Days of Intentional Love",
    durationDays: 30,
    coverGradient: "from-rose-100 to-rose-200",
    accent: "text-rose-900",
  },
  {
    id: "christ-centered-home",
    title: "Building a Christ-Centered Home",
    durationDays: 14,
    coverGradient: "from-emerald-100 to-teal-100",
    accent: "text-emerald-900",
  },
] as const;

export type DevotionalPlanId = (typeof COUPLES_DEVOTIONAL_READING_PLANS)[number]["id"];

const PLAN_STORAGE_KEY = "couples-devotional-plan-progress";

export function readDevotionalPlanProgress(coupleLinkId: string | null): Record<string, number> {
  if (!coupleLinkId || typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(`${PLAN_STORAGE_KEY}:${coupleLinkId}`);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

export function writeDevotionalPlanProgress(coupleLinkId: string, progress: Record<string, number>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${PLAN_STORAGE_KEY}:${coupleLinkId}`, JSON.stringify(progress));
}

export function parseScriptureBlock(scripture: string) {
  const lines = scripture.trim().split("\n").filter(Boolean);
  if (lines.length === 0) return { reference: "", body: "" };
  if (lines.length === 1) {
    const single = lines[0];
    if (single.length < 80 && !single.includes(".")) {
      return { reference: single, body: "" };
    }
    return { reference: "", body: single };
  }
  return { reference: lines[0], body: lines.slice(1).join("\n") };
}

export function formatDevotionalDate(publishDate: string) {
  const d = new Date(publishDate.includes("T") ? publishDate : `${publishDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return publishDate;
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function gentleReadingStreak(devotionals: CoupleMarriageDevotionalView[]) {
  const readCount = devotionals.filter((d) => d.readByMe).length;
  const togetherCount = devotionals.filter((d) => d.readByMe && d.readBySpouse).length;
  return { readCount, togetherCount };
}
