import { isLegacyMeeting } from "@/lib/meeting-catalog";
import { meetingHasJoinLink } from "@/lib/meeting-utils";
import type { Meeting } from "@/lib/types";

/** Online ministry gatherings with a real join link (Zoom, Teams, etc.). */
export function isMinistryOnlineMeeting(
  meeting: Pick<Meeting, "id" | "title" | "platform" | "joinUrl" | "published">,
) {
  if (isLegacyMeeting(meeting)) return false;
  if (meeting.platform === "in-person") return false;
  if (meeting.published === false) return false;
  return meetingHasJoinLink(meeting);
}

export function filterMinistryOnlineMeetings(meetings: Meeting[]) {
  return meetings.filter(isMinistryOnlineMeeting);
}

export function sortMinistryMeetings(meetings: Meeting[]) {
  return [...meetings].sort(
    (left, right) => (left.sortOrder ?? 99) - (right.sortOrder ?? 99),
  );
}
