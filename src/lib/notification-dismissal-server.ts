import * as notificationDismissalDb from "@/lib/stores/notification-dismissal-db";
import * as notificationDismissalJson from "@/lib/stores/notification-dismissal-json";
import { useDatabase } from "@/lib/use-database";

const store = () => (useDatabase() ? notificationDismissalDb : notificationDismissalJson);

export type NotificationDismissalInput = notificationDismissalJson.NotificationDismissalInput;

export const getDismissedNotificationWatermarks = (userId: string) =>
  store().getDismissedNotificationWatermarks(userId);

export const dismissNotificationItems = (userId: string, inputs: NotificationDismissalInput[]) =>
  store().dismissNotificationItems(userId, inputs);

export function isNotificationItemDismissed(
  itemAt: string,
  dismissedThrough: Date | undefined,
) {
  if (!dismissedThrough) return false;
  const at = new Date(itemAt);
  if (Number.isNaN(at.getTime())) return false;
  return at.getTime() <= dismissedThrough.getTime();
}