import type { AppNotificationItemType, FeedReadKey } from "@/lib/notification-types";

export function feedKeyForNotificationType(
  type: AppNotificationItemType,
): FeedReadKey | null {
  switch (type) {
    case "community":
      return "community";
    case "devotion":
      return "devotions";
    case "media":
      return "media";
    case "worship":
      return "worship";
    case "meeting":
      return "meetings";
    case "kids":
      return "kids";
    default:
      return null;
  }
}
