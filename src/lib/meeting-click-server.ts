import type { PublicMember } from "@/lib/auth-types";
import { getGroupDetail } from "@/lib/group-server";
import type { MeetingClickSource } from "@/lib/meeting-click-types";
import { useDatabase } from "@/lib/use-database";
import * as meetingClickDb from "@/lib/stores/meeting-click-db";
import * as meetingClickJson from "@/lib/stores/meeting-click-json";

const store = () => (useDatabase() ? meetingClickDb : meetingClickJson);

export const logMeetingClick = (input: Parameters<typeof meetingClickJson.logMeetingClick>[0]) =>
  store().logMeetingClick(input);

export const getMeetingClicks = (options?: Parameters<typeof meetingClickJson.getMeetingClicks>[0]) =>
  store().getMeetingClicks(options);

export function canViewAllMeetingClickReports(user: PublicMember | null) {
  return user?.role === "leader" || user?.role === "team";
}

export async function canViewGroupMeetingClickReport(
  user: PublicMember | null,
  groupId?: string | null,
) {
  if (!user || !groupId) {
    return false;
  }
  if (canViewAllMeetingClickReports(user)) {
    return true;
  }

  const group = await getGroupDetail(groupId, user.id);
  return Boolean(group?.isAdmin);
}

export async function canViewMeetingClickReport(
  user: PublicMember | null,
  groupId?: string | null,
) {
  if (canViewAllMeetingClickReports(user)) {
    return true;
  }
  if (groupId) {
    return canViewGroupMeetingClickReport(user, groupId);
  }
  return false;
}

export function parseMeetingClickSource(value: string | null): MeetingClickSource | null {
  if (value === "meetings_page" || value === "group_page" || value === "push") {
    return value;
  }
  return null;
}
