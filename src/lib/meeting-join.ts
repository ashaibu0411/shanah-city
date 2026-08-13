import { meetings } from "@/lib/site";
import { getGroupDetail } from "@/lib/group-server";
import type { MeetingJoinTarget } from "@/lib/meeting-click-types";
import { isTrackableJoinUrl } from "@/lib/meeting-join-utils";

export async function resolveMeetingJoinTarget(input: {
  meetingId?: string | null;
  groupId?: string | null;
}): Promise<MeetingJoinTarget | null> {
  if (input.groupId) {
    const group = await getGroupDetail(input.groupId);
    if (!group?.meetingLink || !isTrackableJoinUrl(group.meetingLink)) {
      return null;
    }

    return {
      groupId: group.id,
      groupName: group.name,
      meetingTitle: group.name,
      campusId: group.campusId,
      platform: detectPlatform(group.meetingLink),
      joinUrl: group.meetingLink,
    };
  }

  if (input.meetingId) {
    const meeting = meetings.find((entry) => entry.id === input.meetingId);
    if (!meeting || !isTrackableJoinUrl(meeting.joinUrl)) {
      return null;
    }

    return {
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      campusId: meeting.campusId,
      platform: meeting.platform,
      joinUrl: meeting.joinUrl,
    };
  }

  return null;
}

function detectPlatform(joinUrl: string) {
  const host = joinUrl.toLowerCase();
  if (host.includes("zoom.us") || host.includes("zoom.com")) {
    return "zoom";
  }
  if (host.includes("teams.microsoft") || host.includes("teams.live.com")) {
    return "teams";
  }
  return undefined;
}
