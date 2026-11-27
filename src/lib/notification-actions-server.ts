import { feedKeyForNotificationType } from "@/lib/notification-feed-utils";
import { advanceFeedReadWatermark, markFeedsRead } from "@/lib/feed-read-server";
import { getGroups } from "@/lib/group-server";
import { getAppNotifications } from "@/lib/notification-server";
import { FEED_READ_KEYS, type AppNotificationItem } from "@/lib/notification-types";
import { markPushInboxRead } from "@/lib/push-inbox-server";
import { syncNativeAppBadgeForUser } from "@/lib/native-push-server";
import { useDatabase } from "@/lib/use-database";
import * as groupChatDb from "@/lib/stores/group-chat-db";
import * as groupChatJson from "@/lib/stores/group-chat-json";
import * as messageDb from "@/lib/stores/message-db";
import * as messageJson from "@/lib/stores/message-json";

const messageStore = () => (useDatabase() ? messageDb : messageJson);
const groupChatStore = () => (useDatabase() ? groupChatDb : groupChatJson);

async function markAllDirectThreadsRead(userId: string) {
  const threads = await messageStore().getThreadsForUser(userId);
  await Promise.all(threads.map((thread) => messageStore().markThreadRead(thread.id, userId)));
}

async function markAllGroupChatsRead(userId: string) {
  const groups = await getGroups();
  const memberGroups = groups.filter((group) => group.memberIds.includes(userId));
  await Promise.all(
    memberGroups.map((group) => groupChatStore().markGroupChatRead(group.id, userId)),
  );
}

export async function dismissNotificationItem(userId: string, item: AppNotificationItem) {
  switch (item.type) {
    case "push": {
      const pushId = item.id.replace(/^push-/, "");
      await markPushInboxRead(userId, [pushId]);
      return;
    }
    case "direct_message": {
      const threadId = item.id.replace(/^dm-/, "");
      await messageStore().markThreadRead(threadId, userId);
      return;
    }
    case "group_chat": {
      if (item.groupId) await groupChatStore().markGroupChatRead(item.groupId, userId);
      return;
    }
  }

  const feedKey = feedKeyForNotificationType(item.type);
  if (feedKey) {
    await advanceFeedReadWatermark(userId, feedKey, item.at);
  }
}

export async function clearAllMemberNotifications(userId: string) {
  await markFeedsRead(userId, [...FEED_READ_KEYS]);
  await markPushInboxRead(userId);
  await markAllDirectThreadsRead(userId);
  await markAllGroupChatsRead(userId);
}

export async function clearAllMemberNotificationsWithBadge(userId: string) {
  await clearAllMemberNotifications(userId);
  const summary = await getAppNotifications(userId);
  void syncNativeAppBadgeForUser(userId, summary.total);
  return summary;
}