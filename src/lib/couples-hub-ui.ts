import type { CheckInDimensionId } from "@/lib/couple-check-in-types";
import type { MarriageGoalCategory } from "@/lib/couple-marriage-goal-types";

export const CHECK_IN_SUBTITLES: Record<CheckInDimensionId, string> = {
  communication: "How are we doing?",
  connection: "How connected do we feel?",
  "quality-time": "Are we making time for each other?",
  appreciation: "Do we feel valued?",
  spiritual: "Are we growing together in faith?",
  responsibilities: "How can we support each other?",
};

export const CHECK_IN_ICON_BG: Record<CheckInDimensionId, string> = {
  communication: "bg-sky-100 text-sky-700",
  connection: "bg-rose-100 text-rose-600",
  "quality-time": "bg-orange-100 text-orange-600",
  appreciation: "bg-teal-100 text-teal-700",
  spiritual: "bg-emerald-100 text-emerald-700",
  responsibilities: "bg-amber-100 text-amber-800",
};

export const CHECK_IN_EMOJI: Record<CheckInDimensionId, string> = {
  communication: "💬",
  connection: "💕",
  "quality-time": "⏰",
  appreciation: "✨",
  spiritual: "🙏",
  responsibilities: "🏠",
};

export const GOAL_CATEGORY_META: Record<
  MarriageGoalCategory,
  { emoji: string; circle: string }
> = {
  spiritual: { emoji: "📖", circle: "bg-violet-100" },
  financial: { emoji: "💵", circle: "bg-emerald-100" },
  family: { emoji: "🏠", circle: "bg-orange-100" },
  parenting: { emoji: "👶", circle: "bg-sky-100" },
  communication: { emoji: "💬", circle: "bg-blue-100" },
  enrichment: { emoji: "❤️", circle: "bg-rose-100" },
};

export function prayerEntryIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("family")) return { emoji: "👨‍👩‍👧", circle: "bg-orange-100" };
  if (t.includes("financ")) return { emoji: "🙏", circle: "bg-amber-100" };
  if (t.includes("marriage")) return { emoji: "❤️", circle: "bg-rose-100" };
  if (t.includes("child")) return { emoji: "👶", circle: "bg-sky-100" };
  if (t.includes("future") || t.includes("plan")) return { emoji: "🎯", circle: "bg-blue-100" };
  return { emoji: "🙏", circle: "bg-amber-100" };
}
