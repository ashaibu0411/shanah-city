import {
  AUTOMATED_MEETING_REMINDERS,
  SHIFT_YOUR_EVENING_ID,
  SHIFT_YOUR_MORNING_ID,
} from "@/lib/meeting-catalog";
import { CALENDAR_GROUP_TABS } from "@/lib/church-groups";
import { getZonedDateParts } from "@/lib/denver-time";

export const PRAYER_MINISTRY_GROUP_ID = "group-prayer";
export const PASTORS_GROUP_ID = CALENDAR_GROUP_TABS.pastors;

export const SCHEDULE_SLOT_TYPES = [
  "morning",
  "evening",
  "friday-glory-preaching",
  "sunday-opening-prayer",
] as const;

export type ScheduleSlotType = (typeof SCHEDULE_SLOT_TYPES)[number];
export type PrayerSlotType = ScheduleSlotType;

export type PrayerRotationPoolMember = {
  userId: string;
  name: string;
};

export type PrayerScheduleRotationConfig = {
  slotType: ScheduleSlotType;
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
  slotType: ScheduleSlotType;
  assignmentDate: string;
  userId: string;
  userName: string;
  status: "draft" | "published";
  publishedAt?: string | null;
  notifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type SlotMeta = {
  label: string;
  whenLabel: string;
  notifyGroupId: string;
  memberUrl: string;
  pushPreference: "devotions" | "announcements";
  scheduleKind: "meeting-rule" | "weekday";
  meetingId?: string;
  targetWeekday?: number;
  publishedTitle: string;
  assignedTitle: string;
};

export const SCHEDULE_SLOT_META: Record<ScheduleSlotType, SlotMeta> = {
  morning: {
    label: "Shift Your Morning",
    meetingId: SHIFT_YOUR_MORNING_ID,
    whenLabel: AUTOMATED_MEETING_REMINDERS[SHIFT_YOUR_MORNING_ID].whenLabel,
    notifyGroupId: PRAYER_MINISTRY_GROUP_ID,
    memberUrl: "/meetings",
    pushPreference: "devotions",
    scheduleKind: "meeting-rule",
    publishedTitle: "Shift Your Morning schedule published",
    assignedTitle: "Your Shift Your Morning dates",
  },
  evening: {
    label: "Shift Your Evening",
    meetingId: SHIFT_YOUR_EVENING_ID,
    whenLabel: AUTOMATED_MEETING_REMINDERS[SHIFT_YOUR_EVENING_ID].whenLabel,
    notifyGroupId: PRAYER_MINISTRY_GROUP_ID,
    memberUrl: "/meetings",
    pushPreference: "devotions",
    scheduleKind: "meeting-rule",
    publishedTitle: "Shift Your Evening schedule published",
    assignedTitle: "Your Shift Your Evening dates",
  },
  "friday-glory-preaching": {
    label: "Friday Glory Encounter — Preaching",
    whenLabel: "Fridays",
    notifyGroupId: PASTORS_GROUP_ID,
    memberUrl: "/calendar?group=pastors",
    pushPreference: "announcements",
    scheduleKind: "weekday",
    targetWeekday: 5,
    publishedTitle: "Friday Glory Encounter preaching schedule published",
    assignedTitle: "Your Friday Glory Encounter preaching dates",
  },
  "sunday-opening-prayer": {
    label: "Sunday Opening Prayer",
    whenLabel: "Sundays",
    notifyGroupId: PASTORS_GROUP_ID,
    memberUrl: "/calendar?group=pastors",
    pushPreference: "announcements",
    scheduleKind: "weekday",
    targetWeekday: 0,
    publishedTitle: "Sunday opening prayer schedule published",
    assignedTitle: "Your Sunday opening prayer dates",
  },
};

/** @deprecated Use SCHEDULE_SLOT_META */
export const PRAYER_SLOT_META = SCHEDULE_SLOT_META;

export function parseScheduleSlotType(value: unknown): ScheduleSlotType | null {
  if (typeof value !== "string") return null;
  return SCHEDULE_SLOT_TYPES.includes(value as ScheduleSlotType)
    ? (value as ScheduleSlotType)
    : null;
}

export function defaultPrayerRotationConfig(slotType: ScheduleSlotType): PrayerScheduleRotationConfig {
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

function formatIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function listScheduleAssignmentDates(
  slotType: ScheduleSlotType,
  startDate: string,
  weeksAhead: number,
  skipDates: string[] = [],
) {
  const meta = SCHEDULE_SLOT_META[slotType];
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T12:00:00`);
  const end = new Date(cursor);
  end.setDate(end.getDate() + weeksAhead * 7);

  while (cursor <= end) {
    const iso = formatIsoDate(cursor);
    if (!skipDates.includes(iso)) {
      const denver = getZonedDateParts(cursor);
      const matches =
        meta.scheduleKind === "meeting-rule" && meta.meetingId
          ? AUTOMATED_MEETING_REMINDERS[meta.meetingId].weekdays.includes(denver.weekday)
          : denver.weekday === meta.targetWeekday;

      if (matches) dates.push(iso);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

/** @deprecated Use listScheduleAssignmentDates */
export function listPrayerAssignmentDates(
  slotType: ScheduleSlotType,
  startDate: string,
  weeksAhead: number,
  skipDates: string[] = [],
) {
  return listScheduleAssignmentDates(slotType, startDate, weeksAhead, skipDates);
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

export const SCHEDULE_SLOT_GROUPS = [
  {
    id: "prayer",
    label: "Daily prayer",
    slots: ["morning", "evening"] as ScheduleSlotType[],
  },
  {
    id: "pastors",
    label: "Pastoral services",
    slots: ["friday-glory-preaching", "sunday-opening-prayer"] as ScheduleSlotType[],
  },
] as const;
