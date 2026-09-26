"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { syncAppIconBadgeCount } from "@/lib/app-icon-badge";
import { isNativeAppPlatform } from "@/lib/native-app";
import { refreshAppNotificationBadge } from "@/lib/use-notifications";

/**
 * Keeps the launcher / home-screen badge in sync even when the notification bell
 * is not mounted (e.g. immersive messages UI).
 */
export function AppNotificationBadgeSync() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      void syncAppIconBadgeCount(0);
      return;
    }

    const syncBadge = () => {
      void refreshAppNotificationBadge();
    };

    syncBadge();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        syncBadge();
      }
    };

    const interval = window.setInterval(syncBadge, 30_000);
    window.addEventListener("focus", syncBadge);
    window.addEventListener("shanah-notifications-changed", syncBadge);
    window.addEventListener("shanah-push-synced", syncBadge);
    document.addEventListener("visibilitychange", onVisibility);

    let removeAppListener: (() => void) | undefined;

    if (isNativeAppPlatform()) {
      void import("@capacitor/app").then(({ App }) => {
        void App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) {
            syncBadge();
          }
        }).then((handle) => {
          removeAppListener = () => {
            void handle.remove();
          };
        });
      });
    }

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", syncBadge);
      window.removeEventListener("shanah-notifications-changed", syncBadge);
      window.removeEventListener("shanah-push-synced", syncBadge);
      document.removeEventListener("visibilitychange", onVisibility);
      removeAppListener?.();
    };
  }, [user, loading]);

  return null;
}
