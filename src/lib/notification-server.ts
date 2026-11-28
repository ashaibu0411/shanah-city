import { getPushInboxItems } from "@/lib/push-inbox-server";
import { getGroups } from "@/lib/group-server";
import { getFeedNotificationItems } from "@/lib/feed-notification-items";
import { getMinistryReportNotificationItems } from "@/lib/ministry-report-notification-items";
import {
  getDismissedNotificationWatermarks,
  isNotificationItemDismissed,
} from "@/lib/notification-dismissal-server";
import type { AppNotificationItem, AppNotificationItemType, AppNotificationsSummary } from "@/lib/notification-types";
import * as groupChatDb from "@/lib/stores/group-chat-db";
import * as groupChatJson from "@/lib/stores/group-chat-json";
import * as messageDb from "@/lib/stores/message-db";
import * as messageJson from "@/lib/stores/message-json";
import { useDatabase } from "@/lib/use-database";

const messageStore = () => (useDatabase() ? messageDb : messageJson);
const groupChatStore = () => (useDatabase() ? groupChatDb : groupChatJson);

function countByType(items: AppNotificationItem[], type: AppNotificationItemType) {
  return items
    .filter((item) => item.type === type)
    .reduce((sum, item) => sum + item.count, 0);
}

export async function getRawAppNotificationItems(userId: string): Promise<AppNotificationItem[]> {
  const groups = await getGroups();
  const [directItems, groupItems, feedItems, ministryReportItems, pushItems] = await Promise.all([
    messageStore().getUnreadDirectMessageSummary(userId),
    groupChatStore().getUnreadGroupChatSummary(userId, groups),
    getFeedNotificationItems(userId),
    getMinistryReportNotificationItems(userId),
    getPushInboxItems(userId),
  ]);

  return [...directItems, ...groupItems, ...feedItems, ...ministryReportItems, ...pushItems].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}

export async function getAppNotifications(userId: string): Promise<AppNotificationsSummary> {
  const allItems = await getRawAppNotificationItems(userId);
  const dismissed = await getDismissedNotificationWatermarks(userId);
  const items = allItems.filter(
    (item) => !isNotificationItemDismissed(item.at, dismissed.get(item.id)),
  );

  const directMessagesUnread = allItems
    .filter((item) => item.type === "direct_message")
    .reduce((sum, item) => sum + item.count, 0);
  const groupChatUnread = allItems
    .filter((item) => item.type === "group_chat")
    .reduce((sum, item) => sum + item.count, 0);

  const community = countByType(items, "community");
  const devotions = countByType(items, "devotion");
  const media = countByType(items, "media");
  const worship = countByType(items, "worship");
  const meetings = countByType(items, "meeting");
  const kids = countByType(items, "kids");
  const vision = countByType(items, "vision");
  const ministryReports = items
    .filter((item) => item.type === "ministry_report")
    .reduce((sum, item) => sum + item.count, 0);
  const feedTotal = community + devotions + media + worship + meetings + kids + vision;

  const visibleDirect = items
    .filter((item) => item.type === "direct_message")
    .reduce((sum, item) => sum + item.count, 0);
  const visibleGroup = items
    .filter((item) => item.type === "group_chat")
    .reduce((sum, item) => sum + item.count, 0);
  const pushCount = items.filter((item) => item.type === "push").length;

  return {
    total: visibleDirect + visibleGroup + feedTotal + ministryReports + pushCount,
    directMessages: directMessagesUnread,
    groupChat: groupChatUnread,
    community,
    devotions,
    media,
    worship,
    meetings,
    kids,
    vision,
    items,
  };
}