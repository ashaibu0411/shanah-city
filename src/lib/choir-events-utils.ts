import { isGroupScheduleDetailEvent, isGroupSyncedCalendarEventId } from "@/lib/choir-calendar-utils";
import { isPrivateChurchCalendarEvent } from "@/lib/calendar-utils";
import type {
  ChoirWorshipEventsTabId,
  WorshipEventCategory,
  WorshipEventRegistrationStatus,
} from "@/lib/choir-events-types";
import { CHOIR_HERO_IMAGE_PATH, SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { parseChurchEventDay } from "@/lib/home-upcoming-events";
import type { EventRsvpSummary } from "@/lib/event-rsvp-types";
import type { ChurchEvent } from "@/lib/types";
import type { ChoirWorshipEventMeta } from "@/lib/choir-events-types";

export function worshipEventImageUrl(event: ChurchEvent) {
  return (
    event.artworkWideUrl?.trim() ||
    event.artworkBannerUrl?.trim() ||
    event.artworkSquareUrl?.trim() ||
    CHOIR_HERO_IMAGE_PATH
  );
}

export function churchEventPrimaryDateKey(event: ChurchEvent) {
  return event.startsOn?.trim()?.slice(0, 10) || event.date?.trim()?.slice(0, 10) || "";
}

export function inferWorshipEventCategory(
  event: ChurchEvent,
  meta?: ChoirWorshipEventMeta | null,
): WorshipEventCategory {
  if (meta?.category) return meta.category;
  const title = event.title.toLowerCase();
  if (title.includes("concert")) return "concert";
  if (title.includes("conference")) return "conference";
  if (title.includes("retreat")) return "retreat";
  if (title.includes("intensive")) return "intensive";
  if (title.includes("workshop") || title.includes("training")) return "training";
  if (title.includes("worship night") || title.includes("night of worship")) return "worship_night";
  if (title.includes("celebration")) return "celebration";
  if (title.includes("gathering")) return "gathering";
  return "other";
}

export function worshipEventCategoryLabel(category: WorshipEventCategory) {
  switch (category) {
    case "worship_night":
      return "Worship Night";
    case "concert":
      return "Worship Concert";
    case "conference":
      return "Conference";
    case "training":
      return "Training";
    case "intensive":
      return "Team Intensive";
    case "retreat":
      return "Retreat";
    case "gathering":
      return "Special Gathering";
    case "celebration":
      return "Celebration";
    default:
      return "Worship Event";
  }
}

export function isRoutineWorshipScheduleEvent(event: ChurchEvent) {
  if (isGroupScheduleDetailEvent(event.id) || isGroupSyncedCalendarEventId(event.id)) {
    return true;
  }
  if (event.recurringWeekday != null && !event.rsvpEnabled) {
    const title = event.title.toLowerCase();
    if (
      title.includes("rehearsal") ||
      title.includes("sunday service") ||
      title.includes("weekly") ||
      title === "sunday service"
    ) {
      return true;
    }
  }
  return false;
}

export function isWorshipEventsEligible(
  event: ChurchEvent,
  groupId: string,
  meta?: ChoirWorshipEventMeta | null,
) {
  if (event.published === false) return false;
  if (isPrivateChurchCalendarEvent(event)) return false;
  if (meta?.canceledAt) return false;
  if (isRoutineWorshipScheduleEvent(event)) return false;

  if (meta?.includeOnWorshipEvents === true) return true;
  if ((event.groupId ?? null) === groupId) {
    if (meta?.includeOnWorshipEvents === false) return false;
    return true;
  }
  return false;
}

export function worshipEventStartsAtMs(event: ChurchEvent, dateKey?: string) {
  const key = dateKey || churchEventPrimaryDateKey(event);
  if (!key) return 0;
  const day = new Date(`${key}T12:00:00`);
  return day.getTime();
}

export function formatWorshipEventDateParts(event: ChurchEvent, dateKey?: string) {
  const key = dateKey || churchEventPrimaryDateKey(event);
  const day = key ? new Date(`${key}T12:00:00`) : parseChurchEventDay(event);
  if (!day || Number.isNaN(day.getTime())) {
    return {
      dateKey: key,
      monthLabel: "TBD",
      dayLabel: "—",
      weekdayLabel: "",
      dateLabel: event.date || "Date TBA",
    };
  }
  return {
    dateKey: key,
    monthLabel: day.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    dayLabel: String(day.getDate()),
    weekdayLabel: day.toLocaleDateString(undefined, { weekday: "short" }),
    dateLabel: day.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };
}

function isRsvpClosed(event: Pick<ChurchEvent, "rsvpDeadline">) {
  if (!event.rsvpDeadline) return false;
  return new Date(event.rsvpDeadline).getTime() <= Date.now();
}

export function registrationStatusForEvent(
  event: ChurchEvent,
  options?: {
    summary?: EventRsvpSummary | null;
    myStatus?: string | null;
    canceled?: boolean;
  },
): { status: WorshipEventRegistrationStatus; label: string } {
  if (options?.canceled || event.published === false) {
    return { status: "canceled", label: "Canceled" };
  }
  if (!event.rsvpEnabled) {
    return { status: "not_required", label: "Registration not required" };
  }
  if (options?.myStatus === "going") {
    return { status: "registered", label: "Registered" };
  }
  if (isRsvpClosed(event)) {
    return { status: "closed", label: "Registration closed" };
  }
  if (options?.summary?.isFull) {
    return { status: "full", label: "Registration full" };
  }
  return { status: "open", label: "Registration open" };
}

export function parseEventTimeTo24(time: string | undefined | null) {
  const raw = time?.trim();
  if (!raw) return "19:00";
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) {
    const twentyFour = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (twentyFour) {
      return `${twentyFour[1].padStart(2, "0")}:${twentyFour[2]}`;
    }
    return "19:00";
  }
  let hour = Number(match[1]);
  const minute = match[2] ?? "00";
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

export function defaultAudienceLabel(groupId: string) {
  return groupId === SHANAH_WORSHIP_GROUP_ID ? "Shanah Worship" : "Worship team";
}

export function parseWorshipEventsTab(value: string | null): ChoirWorshipEventsTabId {
  if (value === "registrations" || value === "teams" || value === "past" || value === "guidelines") {
    return value;
  }
  return "events";
}
