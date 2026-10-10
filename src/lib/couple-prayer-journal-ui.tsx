import {
  COUPLE_PRAYER_JOURNAL_CATEGORIES,
  type CouplePrayerJournalCategoryId,
  type CouplePrayerJournalStatus,
} from "@/lib/couple-prayer-journal-types";

export type PrayerJournalTab = "requests" | "answered" | "add";

const iconClass = "h-5 w-5";

export function prayerJournalCategoryMeta(id: CouplePrayerJournalCategoryId) {
  return COUPLE_PRAYER_JOURNAL_CATEGORIES.find((c) => c.id === id) ?? COUPLE_PRAYER_JOURNAL_CATEGORIES[2];
}

export function prayerJournalPhotoUrl(photoKey?: string) {
  if (!photoKey) return null;
  return `/api/couples/prayer-journal/photo?key=${encodeURIComponent(photoKey)}`;
}

export function prayerJournalStatusBadge(status: CouplePrayerJournalStatus) {
  if (status === "answered") {
    return "bg-emerald-100 text-emerald-900";
  }
  return "bg-sky-100 text-sky-900";
}

export function PrayerJournalCategoryIcon({
  icon,
}: {
  icon: (typeof COUPLE_PRAYER_JOURNAL_CATEGORIES)[number]["icon"];
}) {
  switch (icon) {
    case "family":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="9" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="16" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M5 19c.6-2.5 2.4-4 4-4s3.4 1.5 4 4M13 19c.5-2 1.8-3.5 3.5-3.5S20 17 20.5 19"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "praying-hands":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8 10V8a3 3 0 0 1 6 0v2M7 10h10v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-8Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M10 14c.6 1 1.6 1.6 2.5 1.6S14.4 15 15 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "heart":
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
    case "target":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

export function formatPrayerDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function prayerPreview(body: string) {
  const line = body.trim().split("\n")[0];
  if (line.length <= 100) return line;
  return `${line.slice(0, 97)}…`;
}
