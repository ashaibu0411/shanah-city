import { getZonedDateParts } from "@/lib/denver-time";
import { AUTOMATED_MEETING_REMINDERS } from "@/lib/meeting-catalog";
import { isPrayerReminderDue } from "@/lib/prayer-schedule";
import { notifyScheduledMeeting } from "@/lib/push-server";
import { getMeetings, updateMeeting } from "@/lib/meeting-server";

export async function processScheduledMeetingReminders(reference = new Date()) {
  const denver = getZonedDateParts(reference);
  const meetings = await getMeetings();
  const due = meetings.filter((meeting) => {
    const rule = AUTOMATED_MEETING_REMINDERS[meeting.id];
    if (!rule || !meeting.notifyEnabled) return false;
    if (!isPrayerReminderDue(meeting.id, reference)) return false;
    return meeting.lastNotifiedOn !== denver.dateKey;
  });

  if (due.length === 0) {
    return {
      sent: 0,
      skipped: true,
      reason: "no_due_reminders",
      denverDate: denver.dateKey,
      denverHour: denver.hour,
      denverWeekday: denver.weekday,
    };
  }

  let sent = 0;
  const results: Array<{ id: string; title: string; sent: number }> = [];

  for (const meeting of due) {
    const result = await notifyScheduledMeeting({
      id: meeting.id,
      title: meeting.title,
      schedule: meeting.schedule,
      platform: meeting.platform,
    });
    if (result.configured) {
      await updateMeeting(meeting.id, { lastNotifiedOn: denver.dateKey });
    }
    sent += result.sent;
    results.push({ id: meeting.id, title: meeting.title, sent: result.sent });
  }

  return {
    sent,
    skipped: false,
    denverDate: denver.dateKey,
    denverHour: denver.hour,
    denverWeekday: denver.weekday,
    meetings: results,
  };
}

export { processScheduledMeetingReminders as processMorningPrayerReminders };
