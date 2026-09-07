import { notifyLiveStreamNow } from "@/lib/push-server";
import {
  getLiveStreamSchedules,
  markLiveStreamNotifySent,
} from "@/lib/live-schedule-server";

const NOTIFY_GRACE_MS = 15 * 60 * 1000;

export async function processScheduledLiveStreamNotifications(reference = new Date()) {
  const schedules = await getLiveStreamSchedules();
  let sent = 0;
  let checked = 0;

  for (const schedule of schedules) {
    if (!schedule.notifyEnabled || schedule.notifySentAt) continue;
    checked += 1;

    const startsAt = new Date(schedule.startsAt);
    if (Number.isNaN(startsAt.getTime())) continue;

    const elapsed = reference.getTime() - startsAt.getTime();
    if (elapsed < 0 || elapsed > NOTIFY_GRACE_MS) continue;

    const result = await notifyLiveStreamNow({
      authorId: schedule.createdBy,
      title: schedule.title,
      body: schedule.notifyBody?.trim() || undefined,
    });

    if (result.configured === false) {
      return { checked: true, sent, error: "push_not_configured" };
    }

    await markLiveStreamNotifySent(schedule.id);
    sent += result.sent;
  }

  return { checked: checked > 0, sent };
}
