"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppShell } from "@/components/app/AppShellContext";

const BODY_CLASS = "premium-home-v4-active";

/** Applies full-page V4 chrome on mobile home only — other routes unchanged. */
export function PremiumHomeV4Chrome() {
  const pathname = usePathname();
  const { isMobileApp } = useAppShell();
  const active = isMobileApp && pathname === "/";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle(BODY_CLASS, active);
    return () => {
      document.body.classList.remove(BODY_CLASS);
    };
  }, [active]);

  return null;
}
