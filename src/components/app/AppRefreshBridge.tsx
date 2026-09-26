"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAppShell } from "@/components/app/AppShellContext";
import { dispatchAppRefresh, registerAppRefreshRunner } from "@/lib/app-refresh";
import { isNativeAppPlatform } from "@/lib/native-app";
import {
  notifyNotificationsChanged,
  refreshAppNotificationBadge,
} from "@/lib/use-notifications";

export function AppRefreshBridge() {
  const router = useRouter();
  const { isNativeApp } = useAppShell();
  const { refresh: refreshAuth } = useAuth();

  const runRefresh = useCallback(async () => {
    await refreshAuth();
    await refreshAppNotificationBadge();
    dispatchAppRefresh();
    router.refresh();
    notifyNotificationsChanged();
  }, [refreshAuth, router]);

  useEffect(() => {
    registerAppRefreshRunner(runRefresh);
    return () => registerAppRefreshRunner(null);
  }, [runRefresh]);

  useEffect(() => {
    if (!isNativeApp && !isNativeAppPlatform()) return;

    let removeListener: (() => void) | undefined;

    void import("@capacitor/app").then(({ App }) => {
      void App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          void runRefresh();
        }
      }).then((handle) => {
        removeListener = () => {
          void handle.remove();
        };
      });
    });

    return () => {
      removeListener?.();
    };
  }, [isNativeApp, runRefresh]);

  return null;
}
