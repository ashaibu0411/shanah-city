"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { syncAppIconBadgeCount } from "@/lib/app-icon-badge";
import type { AppNotificationsSummary } from "@/lib/notification-types";

const EMPTY: AppNotificationsSummary = {
  total: 0,
  directMessages: 0,
  groupChat: 0,
  community: 0,
  devotions: 0,
  media: 0,
  worship: 0,
  meetings: 0,
  kids: 0,
  items: [],
};

let badgeRefreshInFlight: Promise<AppNotificationsSummary | null> | null = null;

/** Fetch unread counts and sync the home-screen / PWA app icon badge. */
export async function refreshAppNotificationBadge(): Promise<AppNotificationsSummary | null> {
  if (typeof window === "undefined") return null;

  if (badgeRefreshInFlight) {
    return badgeRefreshInFlight;
  }

  badgeRefreshInFlight = (async () => {
    try {
      const response = await fetch("/api/notifications", {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        await syncAppIconBadgeCount(0);
        return EMPTY;
      }

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as AppNotificationsSummary;
      await syncAppIconBadgeCount(data.total);
      return data;
    } catch {
      return null;
    } finally {
      badgeRefreshInFlight = null;
    }
  })();

  return badgeRefreshInFlight;
}

export function notifyNotificationsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("shanah-notifications-changed"));
}

export function useNotifications() {
  const { user, loading } = useAuth();
  const [summary, setSummary] = useState<AppNotificationsSummary>(EMPTY);
  const [fetching, setFetching] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setSummary(EMPTY);
      await syncAppIconBadgeCount(0);
      return;
    }

    setFetching(true);
    try {
      const data = await refreshAppNotificationBadge();
      if (data) {
        setSummary(data);
      } else {
        setSummary(EMPTY);
      }
    } catch {
      setSummary(EMPTY);
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;
    void refresh();
  }, [loading, refresh]);

  useEffect(() => {
    if (!user) return;

    const onRefresh = () => {
      void refresh();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    const interval = window.setInterval(onRefresh, 30_000);
    window.addEventListener("focus", onRefresh);
    window.addEventListener("shanah-notifications-changed", onRefresh);
    window.addEventListener("shanah-push-synced", onRefresh);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onRefresh);
      window.removeEventListener("shanah-notifications-changed", onRefresh);
      window.removeEventListener("shanah-push-synced", onRefresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user, refresh]);

  return {
    total: summary.total,
    items: summary.items,
    directMessages: summary.directMessages,
    groupChat: summary.groupChat,
    community: summary.community,
    devotions: summary.devotions,
    media: summary.media,
    worship: summary.worship,
    meetings: summary.meetings,
    kids: summary.kids,
    fetching,
    refresh,
  };
}
