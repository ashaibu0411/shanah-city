import {
  getDevotionsDueForNotification,
  markDevotionNotified,
} from "@/lib/devotion-server";
import { notifyNewDevotion } from "@/lib/push-server";

export async function processScheduledDevotionNotifications() {
  const due = await getDevotionsDueForNotification();
  let notified = 0;

  for (const devotion of due) {
    await notifyNewDevotion({
      title: devotion.title,
      authorId: devotion.authorId ?? "",
    });
    await markDevotionNotified(devotion.id);
    notified += 1;
  }

  return { notified, checked: due.length };
}
