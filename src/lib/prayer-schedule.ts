import { getZonedDateParts, type ZonedDateParts } from "@/lib/denver-time";
import {
  AUTOMATED_MEETING_REMINDERS,
  SHIFT_YOUR_EVENING_ID,
  SHIFT_YOUR_MORNING_ID,
} from "@/lib/meeting-catalog";
import type { AutomatedReminderRule } from "@/lib/meeting-catalog";
import type { Meeting } from "@/lib/types";

const PRAYER_HOME_IDS = [SHIFT_YOUR_MORNING_ID, SHIFT_YOUR_EVENING_ID] as const;

function minutesSinceMidnight(parts: ZonedDateParts) {
  return parts.hour * 60 + parts.minute;
}

/** Home banner appears at notify time (e.g. 7:57) through end of prayer window. */
function homeBannerBounds(rule: AutomatedReminderRule) {
  return {
    start: rule.notifyHour * 60 + rule.notifyMinute,
    end: rule.endHour * 60 + rule.endMinute,
  };
}

export function isWithinPrayerHomeWindow(meetingId: string, reference = new Date()) {
  const rule = AUTOMATED_MEETING_REMINDERS[meetingId];
  if (!rule) return false;

  const denver = getZonedDateParts(reference);
  if (!rule.weekdays.includes(denver.weekday)) return false;

  const { start, end } = homeBannerBounds(rule);
  const now = minutesSinceMidnight(denver);
  return now >= start && now < end;
}

/** True during the notify window (for 5-minute GitHub Actions cron). */
export function isPrayerReminderDue(meetingId: string, reference = new Date()) {
  const rule = AUTOMATED_MEETING_REMINDERS[meetingId];
  if (!rule) return false;

  const denver = getZonedDateParts(reference);
  if (!rule.weekdays.includes(denver.weekday)) return false;

  const notifyAt = rule.notifyHour * 60 + rule.notifyMinute;
  const now = minutesSinceMidnight(denver);
  // Wider window so */5 cron (7:55, 8:00, …) still catches 7:57 reminders.
  return now >= notifyAt - 2 && now < notifyAt + 10;
}

export function getActiveHomePrayerMeeting(
  meetings: Meeting[],
  reference = new Date(),
): Meeting | null {
  for (const id of PRAYER_HOME_IDS) {
    if (!isWithinPrayerHomeWindow(id, reference)) continue;
    const meeting = meetings.find((entry) => entry.id === id);
    if (meeting) return meeting;
  }
  return null;
}

export function msUntilNextPrayerHomeChange(reference = new Date()) {
  const denver = getZonedDateParts(reference);
  const now = minutesSinceMidnight(denver);
  let nextMs = 60_000;

  for (const id of PRAYER_HOME_IDS) {
    const rule = AUTOMATED_MEETING_REMINDERS[id];
    if (!rule || !rule.weekdays.includes(denver.weekday)) continue;

    const { start, end } = homeBannerBounds(rule);
    if (now < start) {
      nextMs = Math.min(nextMs, (start - now) * 60_000);
    } else if (now >= start && now < end) {
      nextMs = Math.min(nextMs, (end - now) * 60_000);
    }
  }

  return Math.max(1_000, nextMs);
}
