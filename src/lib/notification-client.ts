"use client";

import { FEED_READ_KEYS, type FeedReadKey } from "@/lib/notification-types";
import { notifyNotificationsChanged } from "@/lib/use-notifications";

export async function markNotificationFeedsRead(feeds: FeedReadKey[]) {
  if (feeds.length === 0) return false;

  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markFeedRead", feeds }),
    });
    if (response.ok) {
      notifyNotificationsChanged();
    }
    return response.ok;
  } catch {
    return false;
  }
}

export async function clearAllFeedNotifications() {
  return markNotificationFeedsRead([...FEED_READ_KEYS]);
}
