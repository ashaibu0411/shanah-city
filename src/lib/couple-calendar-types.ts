export const COUPLE_CALENDAR_CATEGORIES = [
  { id: "general", label: "General" },
  { id: "date-night", label: "Date night" },
  { id: "anniversary", label: "Anniversary" },
  { id: "family", label: "Family" },
  { id: "appointment", label: "Appointment" },
  { id: "church", label: "Church" },
] as const;

export type CoupleCalendarEventCategory = (typeof COUPLE_CALENDAR_CATEGORIES)[number]["id"];

export type CoupleCalendarRecurrence = "none" | "daily" | "weekly";

export type CoupleCalendarEventRecord = {
  id: string;
  coupleLinkId: string;
  createdBy: string;
  title: string;
  notes?: string;
  category: CoupleCalendarEventCategory;
  startAt: string;
  endAt?: string;
  allDay: boolean;
  timezone: string;
  recurrence?: CoupleCalendarRecurrence;
  reminderMin?: number;
  createdAt: string;
  updatedAt: string;
};

export type CoupleCalendarPlannable = {
  id: string;
  title: string;
  time?: string;
  schedule?: string;
  calendarPreview?: string;
  startsOn?: string | null;
  endsOn?: string | null;
  recurringWeekday?: number | null;
  recurringWeekdays?: number[] | null;
  category: CoupleCalendarEventCategory;
  allDay: boolean;
  notes?: string;
  startAt: string;
  endAt?: string;
  timezone: string;
  recurrence?: CoupleCalendarRecurrence;
  reminderMin?: number;
  createdBy: string;
  isVirtualAnniversary?: boolean;
};
