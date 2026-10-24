import type {
  MarriageCounselingSessionRecord,
  MarriageHubUpcomingSessionView,
} from "@/lib/marriage-counseling-types";
import { getPremaritalSessionDefinition } from "@/lib/marriage-premarital-eight-session-program";
import { marriageSessionInstantMs } from "@/lib/marriage-session-scheduling";

export const HUB_UPCOMING_SESSIONS_LIMIT = 5;

export function toHubUpcomingSessionView(
  session: MarriageCounselingSessionRecord,
): MarriageHubUpcomingSessionView {
  const premaritalSessionTitle = session.premaritalSessionKey
    ? getPremaritalSessionDefinition(session.premaritalSessionKey)?.title
    : undefined;
  const locationOrLink =
    session.locationOrLink?.trim() ||
    (session.meetingMode === "video" ? session.zoomUrl?.trim() : undefined) ||
    undefined;
  return {
    id: session.id,
    topic: session.topic,
    premaritalSessionTitle,
    scheduledAt: session.scheduledAt,
    scheduledEndAt: session.scheduledEndAt,
    schedulingTimeZone: session.schedulingTimeZone,
    meetingMode: session.meetingMode,
    locationOrLink,
    zoomUrl: session.zoomUrl?.trim() || undefined,
  };
}

export function filterSortUpcomingJourneySessions(
  sessions: MarriageCounselingSessionRecord[],
  nowMs: number = Date.now(),
): MarriageCounselingSessionRecord[] {
  return sessions
    .filter(
      (s) =>
        s.status !== "cancelled" && marriageSessionInstantMs(s.scheduledAt, s.schedulingTimeZone) >= nowMs,
    )
    .sort(
      (a, b) =>
        marriageSessionInstantMs(a.scheduledAt, a.schedulingTimeZone) -
        marriageSessionInstantMs(b.scheduledAt, b.schedulingTimeZone),
    );
}

export function buildHubUpcomingSessionsFromRecords(
  sessions: MarriageCounselingSessionRecord[],
  options?: { nowMs?: number; limit?: number },
): MarriageHubUpcomingSessionView[] {
  const limit = options?.limit ?? HUB_UPCOMING_SESSIONS_LIMIT;
  const nowMs = options?.nowMs ?? Date.now();
  return filterSortUpcomingJourneySessions(sessions, nowMs)
    .slice(0, limit)
    .map(toHubUpcomingSessionView);
}

export function pickHubNextSession(
  sessions: MarriageCounselingSessionRecord[],
  nowMs: number = Date.now(),
): MarriageCounselingSessionRecord | null {
  return filterSortUpcomingJourneySessions(sessions, nowMs)[0] ?? null;
}
