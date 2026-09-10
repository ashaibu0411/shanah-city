import { getZonedDateParts } from "@/lib/denver-time";
import {
  AUTOMATED_MEETING_REMINDERS,
  isAutomatedReminderMeeting,
  MONTHLY_MEETING_REMINDERS,
} from "@/lib/meeting-catalog";
import { isMonthlyMeetingReminderDue } from "@/lib/monthly-meeting-reminder";
import { isPrayerReminderDue } from "@/lib/prayer-schedule";
import {
  getNativePushTokens,
  getPushSubscriptions,
  notifyScheduledMeeting,
  shouldMarkScheduledPushComplete,
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

  if (shouldMarkScheduledPushComplete(result)) {
    await updateMeeting(meeting.id, { lastNotifiedOn: denverDateKey });
  }

  return result;
}

export async function processScheduledMeetingReminders(reference = new Date()) {
  const denver = getZonedDateParts(reference);
  const meetings = await getMeetings();
  const due = meetings.filter((meeting) => {
    const rule = AUTOMATED_MEETING_REMINDERS[meeting.id];
    if (rule) {
      if (!isAutomatedReminderMeeting(meeting.id) && !meeting.notifyEnabled) {
        return false;
      }
      if (!isPrayerReminderDue(meeting.id, reference)) return false;
      return meeting.lastNotifiedOn !== denver.dateKey;
    }

    if (MONTHLY_MEETING_REMINDERS[meeting.id]) {
      if (!meeting.notifyEnabled) return false;
      if (!isMonthlyMeetingReminderDue(meeting.id, reference)) return false;
      return meeting.lastNotifiedOn !== denver.dateKey;
    }

    return false;
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
          : result.failedUsers > 0
            ? "delivery_failed_retry"
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
    delivery: results.reduce(
      (summary, entry) => ({
        eligibleUsers: summary.eligibleUsers + (entry.pushSent > 0 ? 1 : 0),
        failedRetries: summary.failedRetries + (entry.reason === "delivery_failed_retry" ? 1 : 0),
      }),
      { eligibleUsers: 0, failedRetries: 0 },
    ),
  };
}

export { processScheduledMeetingReminders as processMorningPrayerReminders };
