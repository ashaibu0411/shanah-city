"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { dispatchAppRefresh, registerAppRefreshRunner } from "@/lib/app-refresh";
import { notifyNotificationsChanged } from "@/lib/use-notifications";

export function AppRefreshBridge() {
  const router = useRouter();
  const { refresh: refreshAuth } = useAuth();

  const runRefresh = useCallback(async () => {
    await refreshAuth();
    router.refresh();
    notifyNotificationsChanged();
    dispatchAppRefresh();
  }, [refreshAuth, router]);

  useEffect(() => {
    registerAppRefreshRunner(runRefresh);
    return () => registerAppRefreshRunner(null);
  }, [runRefresh]);

  return null;
}
