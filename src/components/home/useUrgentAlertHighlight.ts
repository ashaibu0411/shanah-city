"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { UrgentAlert } from "@/lib/urgent-alert-types";

export function useUrgentAlertHighlight(alerts: UrgentAlert[]) {
  const searchParams = useSearchParams();
  const targetId = searchParams.get("alert");
  const scrolledRef = useRef(false);

  const highlightAlertId =
    targetId && alerts.some((alert) => alert.id === targetId) ? targetId : null;

  useEffect(() => {
    if (!highlightAlertId || scrolledRef.current) return;
    const element =
      document.getElementById(`urgent-alert-${highlightAlertId}`) ??
      document.getElementById("urgent-alerts-carousel");
    if (!element) return;
    scrolledRef.current = true;
    window.setTimeout(() => {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, [highlightAlertId]);

  return highlightAlertId;
}
