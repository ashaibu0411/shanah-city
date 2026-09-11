import {
  AUTOMATED_MEETING_REMINDERS,
  SHIFT_YOUR_EVENING_ID,
  SHIFT_YOUR_MORNING_ID,
} from "@/lib/meeting-catalog";
import { getZonedDateParts } from "@/lib/denver-time";

export const PRAYER_MINISTRY_GROUP_ID = "group-prayer";

export type PrayerSlotType = "morning" | "evening";

export type PrayerRotationPoolMember = {
  userId: string;
  name: string;
};

export type PrayerScheduleRotationConfig = {
  slotType: PrayerSlotType;
  pool: PrayerRotationPoolMember[];
  rotationIndex: number;
  skipDates: string[];
  weeksAhead: number;
  status: "draft" | "published";
  publishedAt?: string | null;
  scheduleNotifiedAt?: string | null;
  updatedBy?: string | null;
  updatedByName?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PrayerAssignment = {
  id: string;
  slotType: PrayerSlotType;
  assignmentDate: string;
  userId: string;
  userName: string;
  status: "draft" | "published";
  publishedAt?: string | null;
  notifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export const PRAYER_SLOT_META: Record<
  PrayerSlotType,
  { label: string; meetingId: string; whenLabel: string }
> = {
  morning: {
    label: "Shift Your Morning",
    meetingId: SHIFT_YOUR_MORNING_ID,
    whenLabel: AUTOMATED_MEETING_REMINDERS[SHIFT_YOUR_MORNING_ID].whenLabel,
  },
  evening: {
    label: "Shift Your Evening",
    meetingId: SHIFT_YOUR_EVENING_ID,
    whenLabel: AUTOMATED_MEETING_REMINDERS[SHIFT_YOUR_EVENING_ID].whenLabel,
  },
};

export function defaultPrayerRotationConfig(slotType: PrayerSlotType): PrayerScheduleRotationConfig {
  const now = new Date().toISOString();
  return {
    slotType,
    pool: [],
    rotationIndex: 0,
    skipDates: [],
    weeksAhead: 8,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}

export function prayerMeetingIdForSlot(slotType: PrayerSlotType) {
  return PRAYER_SLOT_META[slotType].meetingId;
}

export function listPrayerAssignmentDates(
  slotType: PrayerSlotType,
  startDate: string,
  weeksAhead: number,
  skipDates: string[] = [],
) {
  const rule = AUTOMATED_MEETING_REMINDERS[prayerMeetingIdForSlot(slotType)];
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T12:00:00`);
  const end = new Date(cursor);
  end.setDate(end.getDate() + weeksAhead * 7);

  while (cursor <= end) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (!skipDates.includes(iso)) {
      const denver = getZonedDateParts(cursor);
      if (rule.weekdays.includes(denver.weekday)) {
        dates.push(iso);
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function formatPrayerAssignmentDate(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Denver",
  });
}

export function summarizePrayerDates(dates: string[], limit = 4) {
  const formatted = dates.map(formatPrayerAssignmentDate);
  if (formatted.length <= limit) return formatted.join(", ");
  return `${formatted.slice(0, limit).join(", ")} +${formatted.length - limit} more`;
}
