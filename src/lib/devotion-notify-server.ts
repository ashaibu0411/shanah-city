import {
  getDevotionsDueForNotification,
  getTodayDevotion,
  markDevotionNotified,
} from "@/lib/devotion-server";
import { isDevotionNotifyDue } from "@/lib/devotion-schedule";
import { shouldNotifyDevotionPublish } from "@/lib/devotion-utils";
import { notifyNewDevotion } from "@/lib/push-server";

async function notifyDevotionIfNeeded(
  devotion: Awaited<ReturnType<typeof getTodayDevotion>>,
) {
  if (!devotion || !shouldNotifyDevotionPublish(devotion)) {
    return false;
  }

  await notifyNewDevotion({
    title: devotion.title,
    authorId: devotion.authorId ?? "",
    devotionId: devotion.id,
  });
  await markDevotionNotified(devotion.id);
  return true;
}

export async function processScheduledDevotionNotifications(reference = new Date()) {
  if (isDevotionNotifyDue(reference)) {
    const today = await getTodayDevotion();
    if (await notifyDevotionIfNeeded(today)) {
      return { notified: 1, checked: 1, mode: "daily_730" as const };
    }
  }

  const due = await getDevotionsDueForNotification(reference);
  let notified = 0;

  for (const devotion of due) {
    await notifyNewDevotion({
      title: devotion.title,
      authorId: devotion.authorId ?? "",
      devotionId: devotion.id,
    });
    await markDevotionNotified(devotion.id);
    notified += 1;
  }

  return { notified, checked: due.length, mode: "publish_at" as const };
}
