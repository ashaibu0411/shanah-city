import type { MeetingClickSource } from "@/lib/meeting-click-types";

export function isTrackableJoinUrl(joinUrl: string) {
  const normalized = joinUrl.trim().toLowerCase();
  if (!normalized || normalized.includes("shanahcity.org/contact")) {
    return false;
  }
  return normalized.startsWith("http://") || normalized.startsWith("https://");
}

export function buildTrackedJoinUrl(input: {
  meetingId?: string;
  groupId?: string;
  source: MeetingClickSource;
}) {
  const params = new URLSearchParams();
  if (input.meetingId) {
    params.set("meetingId", input.meetingId);
  }
  if (input.groupId) {
    params.set("groupId", input.groupId);
  }
  params.set("source", input.source);
  return `/api/meetings/join?${params.toString()}`;
}
