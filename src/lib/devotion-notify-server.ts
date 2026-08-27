import {
  getDevotionsDueForNotification,
  getTodayDevotion,
  markDevotionNotified,
} from "@/lib/devotion-server";
import { isDevotionNotifyDue } from "@/lib/devotion-schedule";
import { shouldNotifyDevotionPublish } from "@/lib/devotion-utils";
import { getZonedDateParts } from "@/lib/denver-time";
import { notifyNewDevotion } from "@/lib/push-server";

export async function processScheduledDevotionNotifications(reference = new Date()) {
  const denver = getZonedDateParts(reference);

  if (isDevotionNotifyDue(reference)) {
    const today = await getTodayDevotion();
    if (!today) {
      return {
        notified: 0,
        checked: 0,
        mode: "daily_730" as const,
        skipped: true,
        reason: "no_devotion_for_today",
        denverDate: denver.dateKey,
        denverTime: `${denver.hour}:${String(denver.minute).padStart(2, "0")}`,
      };
    }

    if (!shouldNotifyDevotionPublish(today, reference)) {
      return {
        notified: 0,
        checked: 1,
        mode: "daily_730" as const,
        skipped: true,
        reason: today.notifiedAt ? "already_notified" : "not_publishable",
        devotionId: today.id,
        denverDate: denver.dateKey,
        denverTime: `${denver.hour}:${String(denver.minute).padStart(2, "0")}`,
      };
    }

    const result = await notifyNewDevotion({
      title: today.title,
      authorId: today.authorId ?? "",
      devotionId: today.id,
    });

    if (result.configured && result.sent > 0) {
      await markDevotionNotified(today.id);
    }

    return {
      notified: result.sent > 0 ? 1 : 0,
      checked: 1,
      mode: "daily_730" as const,
      devotionId: today.id,
      pushSent: result.sent,
      pushSkipped: result.skipped,
      pushConfigured: result.configured,
      denverDate: denver.dateKey,
      denverTime: `${denver.hour}:${String(denver.minute).padStart(2, "0")}`,
    };
  }

  const due = await getDevotionsDueForNotification(reference);
  let notified = 0;
  const results: Array<{ id: string; pushSent: number; pushSkipped: number }> = [];

  for (const devotion of due) {
    const result = await notifyNewDevotion({
      title: devotion.title,
      authorId: devotion.authorId ?? "",
      devotionId: devotion.id,
    });
    if (result.configured && result.sent > 0) {
      await markDevotionNotified(devotion.id);
      notified += 1;
    }
    results.push({
      id: devotion.id,
      pushSent: result.sent,
      pushSkipped: result.skipped,
    });
  }

  return {
    notified,
    checked: due.length,
    mode: "publish_at" as const,
    devotions: results,
    skipped: notified === 0 && due.length === 0,
    reason: due.length === 0 ? "outside_notify_window" : undefined,
    denverDate: denver.dateKey,
    denverTime: `${denver.hour}:${String(denver.minute).padStart(2, "0")}`,
  };
}
