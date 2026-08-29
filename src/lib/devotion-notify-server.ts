import {
  getDevotions,
  getDevotionsDueForNotification,
  markDevotionNotified,
} from "@/lib/devotion-server";
import { isDevotionNotifyDue } from "@/lib/devotion-schedule";
import {
  pickTodayDevotionForNotify,
  shouldNotifyDevotionPublish,
} from "@/lib/devotion-utils";
import { getZonedDateParts } from "@/lib/denver-time";
import type { Devotion } from "@/lib/types";
import { notifyNewDevotion } from "@/lib/push-server";

type NotifyAttempt = {
  id: string;
  mode: "daily_730" | "publish_at";
  pushSent: number;
  pushSkipped: number;
  skipped?: boolean;
  reason?: string;
};

async function tryNotifyDevotion(
  devotion: Devotion,
  mode: NotifyAttempt["mode"],
  reference: Date,
  processedIds: Set<string>,
  attempts: NotifyAttempt[],
) {
  if (processedIds.has(devotion.id)) {
    return 0;
  }
  processedIds.add(devotion.id);

  if (!shouldNotifyDevotionPublish(devotion, reference)) {
    attempts.push({
      id: devotion.id,
      mode,
      pushSent: 0,
      pushSkipped: 0,
      skipped: true,
      reason: devotion.notifiedAt ? "already_notified" : "not_publishable",
    });
    return 0;
  }

  const result = await notifyNewDevotion({
    title: devotion.title,
    authorId: devotion.authorId ?? "",
    devotionId: devotion.id,
  });

  if (result.configured && result.sent > 0) {
    await markDevotionNotified(devotion.id);
  }

  attempts.push({
    id: devotion.id,
    mode,
    pushSent: result.sent,
    pushSkipped: result.skipped,
    skipped: result.sent === 0,
    reason:
      result.sent > 0
        ? undefined
        : result.configured
          ? "no_recipients"
          : "push_not_configured",
  });

  return result.sent > 0 ? 1 : 0;
}

export async function processScheduledDevotionNotifications(reference = new Date()) {
  const denver = getZonedDateParts(reference);
  const processedIds = new Set<string>();
  const attempts: NotifyAttempt[] = [];
  let notified = 0;

  if (isDevotionNotifyDue(reference)) {
    const devotions = await getDevotions();
    const today = pickTodayDevotionForNotify(devotions, reference);
    if (today) {
      notified += await tryNotifyDevotion(
        today,
        "daily_730",
        reference,
        processedIds,
        attempts,
      );
    } else {
      attempts.push({
        id: "none",
        mode: "daily_730",
        pushSent: 0,
        pushSkipped: 0,
        skipped: true,
        reason: "no_devotion_for_today",
      });
    }
  }

  // Always catch up scheduled devotions whose go-live time has passed, even if the
  // 7:30 window already ran or skipped (this fixes missed morning pushes the same day).
  const due = await getDevotionsDueForNotification(reference);
  for (const devotion of due) {
    notified += await tryNotifyDevotion(
      devotion,
      "publish_at",
      reference,
      processedIds,
      attempts,
    );
  }

  const dailyAttempt = attempts.find((entry) => entry.mode === "daily_730");
  const mode =
    isDevotionNotifyDue(reference) && dailyAttempt
      ? ("daily_730" as const)
      : due.length > 0
        ? ("publish_at" as const)
        : isDevotionNotifyDue(reference)
          ? ("daily_730" as const)
          : ("publish_at" as const);

  return {
    notified,
    checked: attempts.length,
    mode,
    devotions: attempts.filter((entry) => entry.id !== "none"),
    skipped: notified === 0,
    reason:
      notified === 0
        ? attempts.find((entry) => entry.reason)?.reason ?? "nothing_due"
        : undefined,
    pushConfigured: attempts.some((entry) => entry.reason !== "push_not_configured"),
    denverDate: denver.dateKey,
    denverTime: `${denver.hour}:${String(denver.minute).padStart(2, "0")}`,
  };
}
