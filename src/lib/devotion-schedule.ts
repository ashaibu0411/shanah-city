import { getZonedDateParts, type ZonedDateParts } from "@/lib/denver-time";

/** Daily devotion push — 7:30 AM America/Denver (MST/MDT). */
export const DEVOTION_NOTIFY_HOUR = 7;
export const DEVOTION_NOTIFY_MINUTE = 30;

function minutesSinceMidnight(parts: ZonedDateParts) {
  return parts.hour * 60 + parts.minute;
}

/** Wider window so GitHub Actions (every 5 min) still hits 7:30 reliably. */
export function isDevotionNotifyDue(reference = new Date()) {
  const denver = getZonedDateParts(reference);
  const notifyAt = DEVOTION_NOTIFY_HOUR * 60 + DEVOTION_NOTIFY_MINUTE;
  const now = minutesSinceMidnight(denver);
  return now >= notifyAt - 5 && now < notifyAt + 20;
}

export function defaultDevotionScheduleTime() {
  return `${String(DEVOTION_NOTIFY_HOUR).padStart(2, "0")}:${String(DEVOTION_NOTIFY_MINUTE).padStart(2, "0")}`;
}
