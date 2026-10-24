import { randomUUID } from "crypto";
import { notifyMarriageHomeworkDue } from "@/lib/marriage-counseling-notify";
import { notifyMarriageAppointmentUpcoming } from "@/lib/marriage-counseling-notify";
import { marriageSessionInstantMs } from "@/lib/marriage-session-scheduling";
import { listAllJourneySessions } from "@/lib/marriage-premarital-operations-server";
import { participantHomeworkStatus } from "@/lib/marriage-homework-status";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

/** Requires Vercel cron (or equivalent) calling /api/cron/marriage-premarital-reminders */
export async function processPremaritalReminders(options?: { nowMs?: number }) {
  const nowMs = options?.nowMs ?? Date.now();
  const windowStart = nowMs;
  const windowEnd = nowMs + 24 * 60 * 60 * 1000;
  let appointmentReminders = 0;
  let homeworkReminders = 0;
  let skippedDuplicate = 0;

  const premaritalJourneyIds = await store().listActivePremaritalJourneyIds();

  for (const journeyId of premaritalJourneyIds) {
    const journey = await store().getJourneyById(journeyId);
    if (!journey) continue;
    const partnerIds = [journey.participantAId, journey.participantBId].filter(Boolean) as string[];
    if (partnerIds.length === 0) continue;

    const sessions = await listAllJourneySessions(journeyId);
    for (const session of sessions) {
      if (session.status === "cancelled" || !session.premaritalSessionKey) continue;
      const ms = marriageSessionInstantMs(session.scheduledAt, session.schedulingTimeZone);
      if (ms < windowStart || ms > windowEnd) continue;
      const referenceKey = `${session.id}:${session.scheduledAt}`;
      const recorded = await store().tryRecordPremaritalReminderDelivery({
        id: randomUUID(),
        kind: "appointment_upcoming",
        referenceKey,
        journeyId,
        sentAt: new Date(nowMs).toISOString(),
      });
      if (!recorded) {
        skippedDuplicate += 1;
        continue;
      }
      notifyMarriageAppointmentUpcoming(partnerIds, session.topic);
      appointmentReminders += 1;
    }

    const homeworkRows = await store().listSessionHomeworkForJourney(journeyId);
    for (const hw of homeworkRows.filter((h) => h.status === "released" && h.dueAt)) {
      const dueMs = new Date(hw.dueAt!).getTime();
      if (dueMs < windowStart || dueMs > windowEnd) continue;
      const referenceKey = `${hw.id}:due`;
      const recorded = await store().tryRecordPremaritalReminderDelivery({
        id: randomUUID(),
        kind: "homework_due",
        referenceKey,
        journeyId,
        sentAt: new Date(nowMs).toISOString(),
      });
      if (!recorded) {
        skippedDuplicate += 1;
        continue;
      }
      for (const userId of partnerIds) {
        const response = await store().getSessionHomeworkResponse(hw.id, userId);
        const status = participantHomeworkStatus({ homework: hw, response, nowMs });
        if (status === "submitted") continue;
        notifyMarriageHomeworkDue([userId]);
        homeworkReminders += 1;
      }
    }
  }

  return {
    ok: true,
    appointmentReminders,
    homeworkReminders,
    skippedDuplicate,
    note: "Automatic delivery requires cron job marriage-premarital-reminders on your host.",
  };
}
