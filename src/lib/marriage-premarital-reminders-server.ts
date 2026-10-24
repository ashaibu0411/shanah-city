import { notifyMarriageHomeworkDue } from "@/lib/marriage-counseling-notify";
import { notifyMarriageAppointmentUpcoming } from "@/lib/marriage-counseling-notify";
import { marriageSessionInstantMs } from "@/lib/marriage-session-scheduling";
import { listAllJourneySessions } from "@/lib/marriage-premarital-operations-server";
import { participantHomeworkStatus } from "@/lib/marriage-homework-status";
import {
  notifyCounselorAppointmentUpcoming,
  notifyCounselorAttendanceMissing,
} from "@/lib/marriage-prep-notification-triggers";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";
import { isJourneyCounselorAccessRevoked } from "@/lib/marriage-counseling-access";

const store = () => marriageStore();

/** Requires Vercel cron (or equivalent) calling /api/cron/marriage-premarital-reminders */
export async function processPremaritalReminders(options?: { nowMs?: number }) {
  const nowMs = options?.nowMs ?? Date.now();
  const windowStart = nowMs;
  const windowEnd = nowMs + 24 * 60 * 60 * 1000;
  let appointmentReminders = 0;
  let homeworkReminders = 0;
  let counselorAppointmentReminders = 0;
  let counselorAttendanceReminders = 0;
  let skippedDuplicate = 0;

  const premaritalJourneyIds = await store().listActivePremaritalJourneyIds();

  for (const journeyId of premaritalJourneyIds) {
    const journey = await store().getJourneyById(journeyId);
    if (!journey) continue;
    const partnerIds = [journey.participantAId, journey.participantBId].filter(Boolean) as string[];
    if (partnerIds.length === 0) continue;

    const sessions = await listAllJourneySessions(journeyId);
    const clinical =
      journey.counselorUserId && !isJourneyCounselorAccessRevoked(journey)
        ? await store().listPremaritalSessionClinicalForJourney(journeyId)
        : [];
    const clinicalByKey = new Map(clinical.map((c) => [c.sessionKey, c]));

    for (const session of sessions) {
      if (session.status === "cancelled" || !session.premaritalSessionKey) continue;
      const ms = marriageSessionInstantMs(session.scheduledAt, session.schedulingTimeZone);

      if (ms >= windowStart && ms <= windowEnd) {
        const result = await notifyMarriageAppointmentUpcoming(journey, session.id, {
          sessionTitle: session.topic,
          referenceKey: `${session.id}:${session.scheduledAt}`,
        });
        if (result.created > 0) appointmentReminders += 1;
        else skippedDuplicate += 1;

        if (journey.counselorUserId && !isJourneyCounselorAccessRevoked(journey)) {
          const counselorResult = await notifyCounselorAppointmentUpcoming(
            journey,
            session.id,
            session.scheduledAt,
          );
          if (counselorResult.created > 0) counselorAppointmentReminders += 1;
          else skippedDuplicate += 1;
        }
      }

      if (
        ms < nowMs &&
        journey.counselorUserId &&
        !isJourneyCounselorAccessRevoked(journey) &&
        session.premaritalSessionKey
      ) {
        const record = clinicalByKey.get(session.premaritalSessionKey);
        if (!record?.outcome) {
          const attendanceResult = await notifyCounselorAttendanceMissing(
            journey,
            session.id,
            session.scheduledAt,
          );
          if (attendanceResult.created > 0) counselorAttendanceReminders += 1;
          else skippedDuplicate += 1;
        }
      }
    }

    const homeworkRows = await store().listSessionHomeworkForJourney(journeyId);
    for (const hw of homeworkRows.filter((h) => h.status === "released" && h.dueAt)) {
      const dueMs = new Date(hw.dueAt!).getTime();
      if (dueMs < windowStart || dueMs > windowEnd) continue;
      for (const userId of partnerIds) {
        const response = await store().getSessionHomeworkResponse(hw.id, userId);
        const status = participantHomeworkStatus({ homework: hw, response, nowMs });
        if (status === "submitted") continue;
        const result = await notifyMarriageHomeworkDue(journey, userId, hw.id);
        if (result.created > 0) homeworkReminders += 1;
        else skippedDuplicate += 1;
      }
    }
  }

  return {
    ok: true,
    appointmentReminders,
    homeworkReminders,
    counselorAppointmentReminders,
    counselorAttendanceReminders,
    skippedDuplicate,
    note: "Automatic delivery requires cron job marriage-premarital-reminders on your host.",
  };
}
