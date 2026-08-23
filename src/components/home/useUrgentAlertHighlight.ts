"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { UrgentAlert } from "@/lib/urgent-alert-types";

export function useUrgentAlertHighlight(alert: UrgentAlert | null) {
  const searchParams = useSearchParams();
  const targetId = searchParams.get("alert");
  const scrolledRef = useRef(false);

  const highlighted = Boolean(targetId && alert?.id && alert.id === targetId);

  useEffect(() => {
    if (!highlighted || scrolledRef.current) return;
    const element = document.getElementById(`urgent-alert-${targetId}`);
    if (!element) return;
    scrolledRef.current = true;
    window.setTimeout(() => {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, [highlighted, targetId]);

  return highlighted;
}
