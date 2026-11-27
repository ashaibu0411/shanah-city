import * as notificationDismissalDb from "@/lib/stores/notification-dismissal-db";
import * as notificationDismissalJson from "@/lib/stores/notification-dismissal-json";
import { useDatabase } from "@/lib/use-database";

const store = () => (useDatabase() ? notificationDismissalDb : notificationDismissalJson);

export const getDismissedNotificationItemIds = (userId: string) =>
  store().getDismissedNotificationItemIds(userId);

export const dismissNotificationItemIds = (userId: string, itemIds: string[]) =>
  store().dismissNotificationItemIds(userId, itemIds);