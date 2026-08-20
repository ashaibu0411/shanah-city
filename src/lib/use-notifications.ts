"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
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
      return;
    }

    setFetching(true);
    try {
      const response = await fetch("/api/notifications", { credentials: "include" });
      if (!response.ok) {
        setSummary(EMPTY);
        return;
      }
      const data = (await response.json()) as AppNotificationsSummary;
      setSummary(data);
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

    const interval = window.setInterval(onRefresh, 30_000);
    window.addEventListener("focus", onRefresh);
    window.addEventListener("shanah-notifications-changed", onRefresh);
    document.addEventListener("visibilitychange", onRefresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onRefresh);
      window.removeEventListener("shanah-notifications-changed", onRefresh);
      document.removeEventListener("visibilitychange", onRefresh);
    };
  }, [user, refresh]);

  return {
    total: summary.total,
    items: summary.items,
    directMessages: summary.directMessages,
    groupChat: summary.groupChat,
    fetching,
    refresh,
  };
}
