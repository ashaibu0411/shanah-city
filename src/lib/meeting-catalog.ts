import type { Meeting } from "@/lib/types";

export const SHIFT_YOUR_MORNING_ID = "shift-your-morning";
export const SHIFT_YOUR_EVENING_ID = "shift-your-evening";
export const MEN_OF_LEGACY_ID = "men-of-legacy";
export const SHANAH_LADIES_ID = "shanah-ladies";
export const SHANAH_COUPLES_ID = "shanah-couples";
export const FRONTLINERS_MEETING_ID = "frontliners-meeting";

export const SHIFT_YOUR_MORNING_ZOOM_URL =
  "https://us02web.zoom.us/j/6504487390?pwd=NHRTSXl2ZU9EL0VGMW14SDBIYzdzUT09";
export const SHIFT_YOUR_EVENING_ZOOM_URL = SHIFT_YOUR_MORNING_ZOOM_URL;

export type AutomatedReminderRule = {
  weekdays: number[];
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  notifyHour: number;
  notifyMinute: number;
  whenLabel: string;
};

export const AUTOMATED_MEETING_REMINDERS: Record<string, AutomatedReminderRule> = {
  [SHIFT_YOUR_MORNING_ID]: {
    weekdays: [1, 2, 3, 4, 5],
    startHour: 9,
    startMinute: 0,
    endHour: 9,
    endMinute: 10,
    notifyHour: 9,
    notifyMinute: 0,
    whenLabel: "Monday–Friday at 9:00 AM MST",
  },
  [SHIFT_YOUR_EVENING_ID]: {
    weekdays: [2, 3, 4],
    startHour: 20,
    startMinute: 0,
    endHour: 20,
    endMinute: 40,
    notifyHour: 20,
    notifyMinute: 0,
    whenLabel: "Tuesday–Thursday at 8:00 PM MST",
  },
};

export const MANUAL_PUSH_MEETING_IDS = new Set([
  MEN_OF_LEGACY_ID,
  SHANAH_LADIES_ID,
  SHANAH_COUPLES_ID,
  FRONTLINERS_MEETING_ID,
]);

export const PROTECTED_MEETING_IDS = new Set([
  SHIFT_YOUR_MORNING_ID,
  SHIFT_YOUR_EVENING_ID,
  MEN_OF_LEGACY_ID,
  SHANAH_LADIES_ID,
  SHANAH_COUPLES_ID,
  FRONTLINERS_MEETING_ID,
]);

export const TRACKED_JOIN_MEETING_IDS = new Set([
  SHIFT_YOUR_MORNING_ID,
  SHIFT_YOUR_EVENING_ID,
]);

export function isAutomatedReminderMeeting(id: string) {
  return Boolean(AUTOMATED_MEETING_REMINDERS[id]);
}

export function isTrackedJoinMeeting(id?: string | null) {
  return Boolean(id && TRACKED_JOIN_MEETING_IDS.has(id));
}

export const LEGACY_MEETING_IDS = new Set(["1", "2", "3", "4", "5"]);

export const LEGACY_MEETING_TITLES = new Set([
  "friday evening service",
  "sunday morning service",
  "prayer ministry",
  "watch online",
  "accra campus service",
]);

export function isLegacyMeeting(meeting: Pick<Meeting, "id" | "title" | "joinUrl">) {
  if (LEGACY_MEETING_IDS.has(meeting.id)) return true;
  if (LEGACY_MEETING_TITLES.has(meeting.title.trim().toLowerCase())) return true;
  const joinUrl = meeting.joinUrl?.trim().toLowerCase() ?? "";
  return joinUrl.includes("shanahcity.org/contact");
}

export function isProtectedMeetingId(id: string) {
  return PROTECTED_MEETING_IDS.has(id);
}

export function shiftYourMorningMeeting(): Meeting {
  return {
    id: SHIFT_YOUR_MORNING_ID,
    title: "Shift Your Morning",
    campusId: "online",
    host: "Mary Asibey",
    schedule: "Monday – Friday, 9:00 AM MST",
    platform: "zoom",
    joinUrl: SHIFT_YOUR_MORNING_ZOOM_URL,
    meetingId: "6504487390",
    recurringWeekdays: [1, 2, 3, 4, 5],
    notifyEnabled: true,
    published: true,
    sortOrder: 0,
  };
}

export function shiftYourEveningMeeting(): Meeting {
  return {
    id: SHIFT_YOUR_EVENING_ID,
    title: "Shift Your Evening",
    campusId: "online",
    host: "Mary Asibey",
    schedule: "Tuesday – Thursday, 8:00 PM MST",
    platform: "zoom",
    joinUrl: SHIFT_YOUR_EVENING_ZOOM_URL,
    meetingId: "6504487390",
    recurringWeekdays: [2, 3, 4],
    notifyEnabled: true,
    published: true,
    sortOrder: 1,
  };
}

export function menOfLegacyMeeting(): Meeting {
  return {
    id: MEN_OF_LEGACY_ID,
    title: "Men of Legacy",
    campusId: "online",
    host: "Men of Legacy",
    schedule: "First Tuesday of the month, 8:00 PM MST",
    platform: "zoom",
    joinUrl: "https://us02web.zoom.us/j/89223627784?pwd=2thsBslipL2JQIEkXKMWWhVSZ4Blvs.1",
    meetingId: "89223627784",
    notifyEnabled: false,
    published: true,
    sortOrder: 2,
  };
}

export function shanahLadiesMeeting(): Meeting {
  return {
    id: SHANAH_LADIES_ID,
    title: "Shanah Ladies",
    campusId: "online",
    host: "Transformed Ladies",
    schedule: "First Thursday of the month, 8:00 PM MST",
    platform: "zoom",
    joinUrl: "https://us02web.zoom.us/j/81793880758?pwd=v4hKVatVo2dzPQhS3lksfmt3tiRehp.1",
    meetingId: "81793880758",
    notifyEnabled: false,
    published: true,
    sortOrder: 3,
  };
}

export function shanahCouplesMeeting(): Meeting {
  return {
    id: SHANAH_COUPLES_ID,
    title: "Shanah Couples",
    campusId: "online",
    host: "Shanah Couples",
    schedule: "First Wednesday of the month, 8:00 PM MST",
    platform: "zoom",
    joinUrl: "https://us02web.zoom.us/j/87974267086?pwd=m2kLQv6u2TMPmcpGpQbA6bAiBcUixJ.1",
    meetingId: "87974267086",
    notifyEnabled: false,
    published: true,
    sortOrder: 4,
  };
}

export function frontlinersMeeting(): Meeting {
  return {
    id: FRONTLINERS_MEETING_ID,
    title: "Frontliners",
    campusId: "online",
    host: "FrontLiners",
    schedule: "First Monday of the month, 7:00 PM MST",
    platform: "teams",
    joinUrl:
      "https://teams.microsoft.com/l/meetup-join/19%3ameeting_OWI3MzczNGItNTg2Yi00MjliLWI0ZDMtNjk3MGEzZmM3OTIy%40thread.v2/0?context=%7b%22Tid%22%3a%223db191db-2864-4ba6-b588-3c463f26ca3d%22%2c%22Oid%22%3a%225a0a7b02-4558-48b1-b13a-be0a411fc341%22%7d",
    notifyEnabled: false,
    published: true,
    sortOrder: 5,
  };
}

export function canonicalMeetings(): Meeting[] {
  return [
    shiftYourMorningMeeting(),
    shiftYourEveningMeeting(),
    menOfLegacyMeeting(),
    shanahLadiesMeeting(),
    shanahCouplesMeeting(),
    frontlinersMeeting(),
  ];
}

export function applyCanonicalMeeting(existing: Meeting | undefined, canonical: Meeting): Meeting {
  if (!existing) return canonical;

  return {
    ...existing,
    title: canonical.title,
    campusId: canonical.campusId,
    host: canonical.host,
    schedule: canonical.schedule,
    platform: canonical.platform,
    joinUrl: canonical.joinUrl,
    meetingId: canonical.meetingId,
    recurringWeekdays: canonical.recurringWeekdays,
    recurringWeekday: canonical.recurringWeekday,
    published: true,
    sortOrder: canonical.sortOrder ?? existing.sortOrder,
    notifyEnabled: isAutomatedReminderMeeting(canonical.id)
      ? (existing.notifyEnabled ?? canonical.notifyEnabled ?? true)
      : false,
  };
}
