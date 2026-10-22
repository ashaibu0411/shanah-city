import type { MarriageCounselingSessionRecord } from "@/lib/marriage-counseling-types";

/** Generic counselor authorization failure — no resource existence hints. */
export const MARRIAGE_COUNSELOR_ACCESS_DENIED = "Access denied.";

export function throwCounselorAccessDenied(): never {
  throw new Error(MARRIAGE_COUNSELOR_ACCESS_DENIED);
}

export function isCounselorAccessDeniedMessage(message: string): boolean {
  return (
    message === MARRIAGE_COUNSELOR_ACCESS_DENIED ||
    message === "Counselor access required." ||
    message.includes("Counselor access has been revoked")
  );
}

export function counselorRouteErrorStatus(message: string): number {
  return isCounselorAccessDeniedMessage(message) ? 403 : 400;
}

export function counselorRouteErrorBody(message: string): { error: string } {
  return {
    error: isCounselorAccessDeniedMessage(message)
      ? MARRIAGE_COUNSELOR_ACCESS_DENIED
      : message,
  };
}

/** Session fields safe to return to the creating assigned counselor only. */
export type MarriageCounselorSessionApiView = {
  id: string;
  journeyId: string;
  scheduledAt: string;
  schedulingTimeZone?: string;
  topic?: string;
  zoomUrl?: string;
  status?: string;
  notes?: string;
};

export function toCounselorSessionApiView(
  session: MarriageCounselingSessionRecord,
  viewerCounselorId: string,
): MarriageCounselorSessionApiView {
  if (session.createdBy !== viewerCounselorId) {
    throwCounselorAccessDenied();
  }
  return {
    id: session.id,
    journeyId: session.journeyId,
    scheduledAt: session.scheduledAt,
    schedulingTimeZone: session.schedulingTimeZone,
    topic: session.topic,
    zoomUrl: session.zoomUrl,
    status: session.status,
    notes: session.notes,
  };
}
