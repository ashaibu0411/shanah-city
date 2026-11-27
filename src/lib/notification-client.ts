"use client";

import type { AppNotificationItem, AppNotificationsSummary } from "@/lib/notification-types";
import { FEED_READ_KEYS, type FeedReadKey } from "@/lib/notification-types";
import { syncAppIconBadgeCount } from "@/lib/app-icon-badge";
import { notifyNotificationsChanged } from "@/lib/use-notifications";

async function applyNotificationSummaryResponse(response: Response): Promise<boolean> {
  if (!response.ok) return false;
  const data = (await response.json()) as AppNotificationsSummary;
  await syncAppIconBadgeCount(data.total);
  notifyNotificationsChanged();
  return true;
}

export async function markNotificationFeedsRead(feeds: FeedReadKey[]) {
  if (feeds.length === 0) return false;

  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markFeedRead", feeds }),
    });
    return applyNotificationSummaryResponse(response);
  } catch {
    return false;
  }
}

export async function dismissNotificationItem(item: AppNotificationItem) {
  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "dismissItem",
        item: { id: item.id, type: item.type, at: item.at, groupId: item.groupId },
      }),
    });
    return applyNotificationSummaryResponse(response);
  } catch {
    return false;
  }
}

export async function clearAllFeedNotifications() {
  return clearAllMemberNotifications();
}

export async function clearAllMemberNotifications() {
  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clearAll" }),
    });
    return applyNotificationSummaryResponse(response);
  } catch {
    return false;
  }
}

export async function markAllNotificationsRead() {
  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllAsRead" }),
    });
    return applyNotificationSummaryResponse(response);
  } catch {
    return false;
  }
}

/** @deprecated use markNotificationFeedsRead — kept for tests */
export { FEED_READ_KEYS };