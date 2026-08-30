import { getZonedDateParts, type ZonedDateParts } from "@/lib/denver-time";

/** Daily devotion push — 7:30 AM America/Denver (MST/MDT). */
export const DEVOTION_NOTIFY_HOUR = 7;
export const DEVOTION_NOTIFY_MINUTE = 30;

function minutesSinceMidnight(parts: ZonedDateParts) {
  return parts.hour * 60 + parts.minute;
}

/** Wider window so delayed GitHub/Vercel crons still hit 7:30 reliably (through 8:05 AM). */
export function isDevotionNotifyDue(reference = new Date()) {
  const denver = getZonedDateParts(reference);
  const notifyAt = DEVOTION_NOTIFY_HOUR * 60 + DEVOTION_NOTIFY_MINUTE;
  const now = minutesSinceMidnight(denver);
  return now >= notifyAt - 5 && now < notifyAt + 35;
}

export function defaultDevotionScheduleTime() {
  return `${String(DEVOTION_NOTIFY_HOUR).padStart(2, "0")}:${String(DEVOTION_NOTIFY_MINUTE).padStart(2, "0")}`;
}
