import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import type { MeetingClickSource } from "@/lib/meeting-click-types";
import { useDatabase } from "@/lib/use-database";
import * as meetingClickDb from "@/lib/stores/meeting-click-db";
import * as meetingClickJson from "@/lib/stores/meeting-click-json";

const store = () => (useDatabase() ? meetingClickDb : meetingClickJson);

export const logMeetingClick = (input: Parameters<typeof meetingClickJson.logMeetingClick>[0]) =>
  store().logMeetingClick(input);

export const getMeetingClicks = (options?: Parameters<typeof meetingClickJson.getMeetingClicks>[0]) =>
  store().getMeetingClicks(options);

export async function canViewAllMeetingClickReports(user: PublicMember | null) {
  return canManageAsAdmin(user);
}

export async function canViewMeetingClickReport(user: PublicMember | null) {
  return canManageAsAdmin(user);
}

export function parseMeetingClickSource(value: string | null): MeetingClickSource | null {
  if (
    value === "meetings_page" ||
    value === "group_page" ||
    value === "push" ||
    value === "home"
  ) {
    return value;
  }
  return null;
}
