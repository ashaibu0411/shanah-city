import type { CheckInDimensionId } from "@/lib/couple-check-in-types";

export const CHECK_IN_DISPLAY_LABELS: Record<CheckInDimensionId, string> = {
  communication: "Communication",
  connection: "Emotional Connection",
  "quality-time": "Quality Time",
  appreciation: "Appreciation",
  spiritual: "Spiritual Growth",
  responsibilities: "Shared Responsibilities",
};

export const CHECK_IN_ROW_TINT: Record<CheckInDimensionId, string> = {
  communication: "bg-sky-50/80 ring-sky-100/80",
  connection: "bg-rose-50/70 ring-rose-100/80",
  "quality-time": "bg-amber-50/70 ring-amber-100/80",
  appreciation: "bg-teal-50/70 ring-teal-100/80",
  spiritual: "bg-emerald-50/60 ring-emerald-100/70",
  responsibilities: "bg-stone-100/70 ring-stone-200/80",
};

export const CHECK_IN_ICON_RING: Record<CheckInDimensionId, string> = {
  communication: "bg-sky-100 text-sky-700",
  connection: "bg-rose-100 text-rose-600",
  "quality-time": "bg-amber-100 text-amber-700",
  appreciation: "bg-teal-100 text-teal-700",
  spiritual: "bg-emerald-100 text-emerald-800",
  responsibilities: "bg-[#E8E0D6] text-[var(--couples-mocha)]",
};

const iconClass = "h-5 w-5";

export function CheckInDimensionIcon({ dimension }: { dimension: CheckInDimensionId }) {
  switch (dimension) {
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
    case "connection":
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
    case "quality-time":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 8v4.2l2.8 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "appreciation":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3l1.4 3.2 3.5.3-2.6 2.2.8 3.4-3.1-1.9-3.1 1.9.8-3.4-2.6-2.2 3.5-.3L12 3Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "spiritual":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 4v16M8.5 8.5 12 5l3.5 3.5M7 20h10"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "responsibilities":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 11.5 12 6l7 5.5V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M10 20v-5h4v5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

export const CHECK_IN_SCALE_LABELS = [
  "Needs attention",
  "A little low",
  "Steady",
  "Good",
  "Thriving",
] as const;

export function isCheckInDimensionComplete(draft: {
  reflection?: string;
  rating?: number | null;
}) {
  if (typeof draft.rating === "number" && draft.rating >= 1 && draft.rating <= 5) return true;
  return Boolean((draft.reflection ?? "").trim());
}
