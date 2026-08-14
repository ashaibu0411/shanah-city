import { getMeetingById } from "@/lib/meeting-server";
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
    const meeting = await getMeetingById(input.meetingId);
    if (!meeting?.joinUrl || !isTrackableJoinUrl(meeting.joinUrl)) {
      return null;
    }

    return {
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      campusId: meeting.campusId,
      platform: meeting.platform === "in-person" ? detectPlatform(meeting.joinUrl) : meeting.platform,
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
