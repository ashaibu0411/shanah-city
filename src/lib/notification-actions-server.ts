import { feedKeyForNotificationType } from "@/lib/notification-feed-utils";
import { advanceFeedReadWatermark, markFeedsRead } from "@/lib/feed-read-server";
import { getAppNotifications, getRawAppNotificationItems } from "@/lib/notification-server";
import { dismissNotificationItems } from "@/lib/notification-dismissal-server";
import { FEED_READ_KEYS, type AppNotificationItem } from "@/lib/notification-types";
import { markPushInboxRead } from "@/lib/push-inbox-server";
import { syncNativeAppBadgeForUser } from "@/lib/native-push-server";

function inboxDismissableTypes(item: AppNotificationItem) {
  return (
    item.type === "direct_message" ||
    item.type === "group_chat" ||
    item.type === "ministry_report"
  );
}

export async function dismissNotificationItem(userId: string, item: AppNotificationItem) {
  switch (item.type) {
    case "push": {
      const pushId = item.id.replace(/^push-/, "");
      await markPushInboxRead(userId, [pushId]);
      return;
    }
    case "direct_message":
    case "group_chat":
    case "ministry_report":
      await dismissNotificationItems(userId, [{ itemId: item.id, throughAt: item.at }]);
      return;
    default: {
      const feedKey = feedKeyForNotificationType(item.type);
      if (feedKey) {
        await advanceFeedReadWatermark(userId, feedKey, item.at);
      }
    }
  }
}

/** Clears feed + push notification state only; inbox conversations stay unread in Messages. */
export async function markAllMemberNotificationsRead(userId: string) {
  await markFeedsRead(userId, [...FEED_READ_KEYS]);
  await markPushInboxRead(userId);
}

/** Dismisses all conversation rows from the bell without marking threads read. */
async function dismissAllInboxNotificationRows(userId: string) {
  const rawItems = await getRawAppNotificationItems(userId);
  const inputs = rawItems
    .filter(inboxDismissableTypes)
    .map((item) => ({ itemId: item.id, throughAt: item.at }));
  await dismissNotificationItems(userId, inputs);
}

export async function clearAllMemberNotifications(userId: string) {
  await markAllMemberNotificationsRead(userId);
  await dismissAllInboxNotificationRows(userId);
}

export async function clearAllMemberNotificationsWithBadge(userId: string) {
  await clearAllMemberNotifications(userId);
  const summary = await getAppNotifications(userId);
  void syncNativeAppBadgeForUser(userId, summary.total);
  return summary;
}

export async function markAllMemberNotificationsReadWithBadge(userId: string) {
  await markAllMemberNotificationsRead(userId);
  const summary = await getAppNotifications(userId);
  void syncNativeAppBadgeForUser(userId, summary.total);
  return summary;
}