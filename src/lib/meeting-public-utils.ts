import type { Meeting } from "@/lib/types";

/** Hide join credentials for signed-out callers; join links still route through sign-in. */
export function stripMeetingJoinMetadata(meeting: Meeting): Meeting {
  return {
    ...meeting,
    meetingId: undefined,
    passcode: undefined,
  };
}

export function stripMeetingsJoinMetadata(meetings: Meeting[]) {
  return meetings.map(stripMeetingJoinMetadata);
}
