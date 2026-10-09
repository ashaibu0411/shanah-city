import type { CoupleCalendarEventCategory } from "@/lib/couple-calendar-types";

export type CouplesCalendarViewMode = "month" | "week" | "agenda";

export const COUPLES_CALENDAR_CATEGORY_UI: Record<
  CoupleCalendarEventCategory,
  { label: string; dot: string; iconBg: string; iconColor: string }
> = {
  "date-night": {
    label: "Date Night",
    dot: "#E11D48",
    iconBg: "#F7DFE5",
    iconColor: "#BE123C",
  },
  church: {
    label: "Church",
    dot: "#2563EB",
    iconBg: "#E7EDF5",
    iconColor: "#1D4ED8",
  },
  family: {
    label: "Family",
    dot: "#059669",
    iconBg: "#E3EDE5",
    iconColor: "#047857",
  },
  anniversary: {
    label: "Anniversary",
    dot: "#B78B54",
    iconBg: "#EAD9BF",
    iconColor: "#744B3A",
  },
  general: {
    label: "Personal",
    dot: "#7C3AED",
    iconBg: "#EDE6F5",
    iconColor: "#6D28D9",
  },
  appointment: {
    label: "Personal",
    dot: "#7C3AED",
    iconBg: "#EDE6F5",
    iconColor: "#6D28D9",
  },
};

export function couplesCalendarCategoryUi(category: string) {
  return (
    COUPLES_CALENDAR_CATEGORY_UI[category as CoupleCalendarEventCategory] ??
    COUPLES_CALENDAR_CATEGORY_UI.general
  );
}

const LOCATION_PREFIX = /^Location:\s*(.+?)(?:\n\n|\n*$)/i;

export function splitCalendarNotes(notes?: string) {
  const raw = notes?.trim() ?? "";
  if (!raw) return { location: "", body: "" };
  const match = raw.match(LOCATION_PREFIX);
  if (!match) return { location: "", body: raw };
  const location = match[1].trim();
  const body = raw.slice(match[0].length).trim();
  return { location, body };
}

export function mergeCalendarNotes(location: string, body: string) {
  const loc = location.trim();
  const noteBody = body.trim();
  if (!loc) return noteBody;
  if (!noteBody) return `Location: ${loc}`;
  return `Location: ${loc}\n\n${noteBody}`;
}
