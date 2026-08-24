import { notifyLiveStreamNow } from "@/lib/push-server";
import {
  getLiveStreamSchedule,
  markLiveStreamNotifySent,
} from "@/lib/live-schedule-server";

const NOTIFY_GRACE_MS = 15 * 60 * 1000;

export async function processScheduledLiveStreamNotifications(reference = new Date()) {
  const schedule = await getLiveStreamSchedule();
  if (!schedule?.notifyEnabled || schedule.notifySentAt) {
    return { checked: Boolean(schedule), sent: 0 };
  }

  const startsAt = new Date(schedule.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return { checked: true, sent: 0, error: "invalid_starts_at" };
  }

  const elapsed = reference.getTime() - startsAt.getTime();
  if (elapsed < 0 || elapsed > NOTIFY_GRACE_MS) {
    return { checked: true, sent: 0, waiting: elapsed < 0 };
  }

  const result = await notifyLiveStreamNow({
    authorId: schedule.createdBy,
    title: schedule.title,
    body: schedule.notifyBody?.trim() || undefined,
  });

  if (result.configured === false) {
    return { checked: true, sent: 0, error: "push_not_configured" };
  }

  await markLiveStreamNotifySent();

  return {
    checked: true,
    sent: result.sent,
    skipped: result.skipped,
    scheduleTitle: schedule.title,
  };
}
