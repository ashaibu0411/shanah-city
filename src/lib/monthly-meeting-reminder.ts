import { getZonedDateParts, type ZonedDateParts } from "@/lib/denver-time";
import { MONTHLY_MEETING_REMINDERS } from "@/lib/meeting-catalog";

function minutesSinceMidnight(parts: ZonedDateParts) {
  return parts.hour * 60 + parts.minute;
}

/** True when `parts` falls on the first occurrence of `weekday` in its month. */
export function isFirstWeekdayOfMonth(parts: ZonedDateParts, weekday: number) {
  return parts.weekday === weekday && Number(parts.day) <= 7;
}

/** Day-before reminder for first-week monthly ministry Zooms (e.g. couples on Wed → Tue 8 PM). */
export function isMonthlyMeetingReminderDue(meetingId: string, reference = new Date()) {
  const rule = MONTHLY_MEETING_REMINDERS[meetingId];
  if (!rule) return false;

  const denver = getZonedDateParts(reference);
  if (denver.weekday !== rule.notifyWeekday) return false;

  const tomorrow = new Date(reference.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowDenver = getZonedDateParts(tomorrow);
  if (!isFirstWeekdayOfMonth(tomorrowDenver, rule.meetingWeekday)) return false;

  const notifyAt = rule.notifyHour * 60 + rule.notifyMinute;
  const now = minutesSinceMidnight(denver);
  return now >= notifyAt - 5 && now < notifyAt + 25;
}

export function monthlyMeetingReminderGroupId(meetingId: string) {
  return MONTHLY_MEETING_REMINDERS[meetingId]?.groupId ?? null;
}
