import { getGroups } from "@/lib/group-server";
import { getFeedNotificationItems } from "@/lib/feed-notification-items";
import type { AppNotificationItemType, AppNotificationsSummary } from "@/lib/notification-types";
import * as groupChatDb from "@/lib/stores/group-chat-db";
import * as groupChatJson from "@/lib/stores/group-chat-json";
import * as messageDb from "@/lib/stores/message-db";
import * as messageJson from "@/lib/stores/message-json";
import { useDatabase } from "@/lib/use-database";

const messageStore = () => (useDatabase() ? messageDb : messageJson);
const groupChatStore = () => (useDatabase() ? groupChatDb : groupChatJson);

function countByType(items: { type: AppNotificationItemType; count: number }[], type: AppNotificationItemType) {
  return items
    .filter((item) => item.type === type)
    .reduce((sum, item) => sum + item.count, 0);
}

export async function getAppNotifications(userId: string): Promise<AppNotificationsSummary> {
  const groups = await getGroups();
  const [directItems, groupItems, feedItems] = await Promise.all([
    messageStore().getUnreadDirectMessageSummary(userId),
    groupChatStore().getUnreadGroupChatSummary(userId, groups),
    getFeedNotificationItems(userId),
  ]);

  const items = [...directItems, ...groupItems, ...feedItems].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

  const directMessages = directItems.reduce((sum, item) => sum + item.count, 0);
  const groupChat = groupItems.reduce((sum, item) => sum + item.count, 0);
  const community = countByType(feedItems, "community");
  const devotions = countByType(feedItems, "devotion");
  const media = countByType(feedItems, "media");
  const worship = countByType(feedItems, "worship");
  const meetings = countByType(feedItems, "meeting");
  const kids = countByType(feedItems, "kids");
  const feedTotal = community + devotions + media + worship + meetings + kids;

  return {
    total: directMessages + groupChat + feedTotal,
    directMessages,
    groupChat,
    community,
    devotions,
    media,
    worship,
    meetings,
    kids,
    items,
  };
}
