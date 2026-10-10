import type { CoupleMarriageGoalRecord, MarriageGoalCategory } from "@/lib/couple-marriage-goal-types";

export type GoalsListTab = "active" | "completed";

const iconClass = "h-6 w-6";

export const GOAL_CATEGORY_PROGRESS: Record<MarriageGoalCategory, string> = {
  spiritual: "bg-emerald-600",
  financial: "bg-emerald-500",
  family: "bg-teal-600",
  parenting: "bg-sky-600",
  communication: "bg-blue-600",
  enrichment: "bg-rose-500",
};

export const GOAL_CATEGORY_ICON_RING: Record<MarriageGoalCategory, string> = {
  spiritual: "bg-amber-50 text-[var(--couples-mocha)] ring-amber-100",
  financial: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  family: "bg-amber-50 text-amber-900 ring-amber-100",
  parenting: "bg-sky-50 text-sky-800 ring-sky-100",
  communication: "bg-blue-50 text-blue-800 ring-blue-100",
  enrichment: "bg-rose-50 text-rose-700 ring-rose-100",
};

export function MarriageGoalCategoryIcon({ category }: { category: MarriageGoalCategory }) {
  switch (category) {
    case "spiritual":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 5h11a2 2 0 0 1 2 2v12H8a2 2 0 0 1-2-2V5Z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 5v14h11" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case "financial":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="7" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M7 11h4M7 14h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="16" cy="12.5" r="1.5" fill="currentColor" />
        </svg>
      );
    case "family":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 11.5 12 6l7 5.5V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "parenting":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 19c.5-2.5 2-4 4-4s3.5 1.5 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "communication":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M7 9.5a4.5 4.5 0 1 1 9 0v3.2a4.5 4.5 0 0 1-9 0V12l-2.5 1.7V9.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "enrichment":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 20.5c3.6-2.6 6-5.4 6-8.8a3.8 3.8 0 0 0-7.5-1.2A3.8 3.8 0 0 0 5 11.7c0 3.4 2.4 6.2 7 8.8Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

export type GoalPreviewCard = {
  id: string;
  category: MarriageGoalCategory;
  title: string;
  description: string;
  progress: number;
  targetDate?: string;
};

/** Static examples for empty-state inspiration only — not saved to the API. */
export const MARRIAGE_GOAL_DESIGN_PREVIEWS: GoalPreviewCard[] = [
  {
    id: "preview-spiritual",
    category: "spiritual",
    title: "Grow Spiritually Together",
    description: "Read the Bible together daily",
    progress: 45,
  },
  {
    id: "preview-financial",
    category: "financial",
    title: "Financial Freedom",
    description: "Build our emergency fund",
    progress: 30,
    targetDate: "2026-12-31",
  },
  {
    id: "preview-family",
    category: "family",
    title: "Family Time",
    description: "Have weekly family nights",
    progress: 60,
  },
  {
    id: "preview-enrichment",
    category: "enrichment",
    title: "Marriage Enrichment",
    description: "Take a couples retreat",
    progress: 20,
    targetDate: "2026-09-15",
  },
];

export function formatGoalTargetDate(value?: string) {
  if (!value) return null;
  const d = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function goalProgressHistory(goal: CoupleMarriageGoalRecord) {
  const events: { date: string; label: string; progress: number }[] = [
    { date: goal.createdAt, label: "Goal created", progress: 0 },
  ];
  if (goal.progress > 0 && goal.updatedAt !== goal.createdAt) {
    events.push({
      date: goal.updatedAt,
      label: "Progress updated",
      progress: goal.progress,
    });
  }
  if (goal.progress >= 100) {
    events.push({
      date: goal.updatedAt,
      label: "Marked complete",
      progress: 100,
    });
  }
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function formatGoalHistoryDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
