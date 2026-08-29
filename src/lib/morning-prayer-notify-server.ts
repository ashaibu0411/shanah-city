import { getZonedDateParts } from "@/lib/denver-time";
import {
  AUTOMATED_MEETING_REMINDERS,
  isAutomatedReminderMeeting,
} from "@/lib/meeting-catalog";
import { isPrayerReminderDue } from "@/lib/prayer-schedule";
import {
  getNativePushTokens,
  getPushSubscriptions,
  notifyScheduledMeeting,
} from "@/lib/push-server";
import {
  isAndroidNativePushConfigured,
  isIosNativePushConfigured,
} from "@/lib/native-push-server";
import type { Meeting } from "@/lib/types";
import { getMeetings, updateMeeting } from "@/lib/meeting-server";

type MeetingReminderAttempt = {
  id: string;
  title: string;
  pushSent: number;
  pushSkipped: number;
  configured: boolean;
  skipped?: boolean;
  reason?: string;
};

export async function deliverMeetingReminderPush(
  meeting: Pick<Meeting, "id" | "title" | "schedule" | "platform">,
  denverDateKey: string,
) {
  const result = await notifyScheduledMeeting({
    id: meeting.id,
    title: meeting.title,
    schedule: meeting.schedule,
    platform: meeting.platform,
  });

  if (result.configured && result.sent > 0) {
    await updateMeeting(meeting.id, { lastNotifiedOn: denverDateKey });
  }

  return result;
}

export async function processScheduledMeetingReminders(reference = new Date()) {
  const denver = getZonedDateParts(reference);
  const meetings = await getMeetings();
  const due = meetings.filter((meeting) => {
    const rule = AUTOMATED_MEETING_REMINDERS[meeting.id];
    if (!rule) return false;
    if (!isAutomatedReminderMeeting(meeting.id) && !meeting.notifyEnabled) {
      return false;
    }
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
  const results: MeetingReminderAttempt[] = [];

  for (const meeting of due) {
    const result = await deliverMeetingReminderPush(meeting, denver.dateKey);
    sent += result.sent;
    results.push({
      id: meeting.id,
      title: meeting.title,
      pushSent: result.sent,
      pushSkipped: result.skipped,
      configured: result.configured,
      skipped: result.sent === 0,
      reason:
        result.sent > 0
          ? undefined
          : result.configured
            ? "no_recipients"
            : "push_not_configured",
    });
  }

  const [nativeTokens, webSubs] = await Promise.all([
    getNativePushTokens(),
    getPushSubscriptions(),
  ]);

  return {
    sent,
    skipped: sent === 0,
    denverDate: denver.dateKey,
    denverHour: denver.hour,
    denverWeekday: denver.weekday,
    meetings: results,
    pushDiagnostics: {
      androidConfigured: isAndroidNativePushConfigured(),
      iosConfigured: isIosNativePushConfigured(),
      registeredNativeDevices: nativeTokens.length,
      registeredWebDevices: webSubs.length,
    },
  };
}

export { processScheduledMeetingReminders as processMorningPrayerReminders };
