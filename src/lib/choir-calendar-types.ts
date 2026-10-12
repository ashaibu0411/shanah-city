export type ChoirCalendarEventCategory = "service" | "rehearsal" | "event" | "other";

export type ChoirCalendarPersonalStatus = "assigned" | "confirmed" | "response_needed";

export type ChoirCalendarEvent = {
  id: string;
  sourceType: "worship-plan" | "worship-rehearsal" | "group-event";
  sourceId: string;
  category: ChoirCalendarEventCategory;
  title: string;
  dateKey: string;
  timeLabel: string;
  location: string;
  description?: string;
  teamLabel?: string;
  songCount?: number;
  worshipPlanKey?: string;
  serviceDate?: string;
  serviceTime?: string;
  personalRoleLabel?: string | null;
  personalStatus?: ChoirCalendarPersonalStatus | null;
  detailHref: string;
  startsAtMs: number;
};

export type ChoirCalendarPagePayload = {
  events: ChoirCalendarEvent[];
  canManageSchedule: boolean;
  canManageWorship: boolean;
  groupChatHref: string;
  memberRoleLabel: string | null;
  manageScheduleHref: string;
  managePlannerHref: string;
  legacyCalendarHref: string;
};
