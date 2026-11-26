"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppShell } from "@/components/app/AppShellContext";

const BODY_DESKTOP_V4 = "premium-home-v4-desktop-active";

/** Desktop app home — enables scoped V4 porcelain styles without mobile full-bleed chrome. */
export function PremiumHomeV4DesktopChrome() {
  const pathname = usePathname();
  const { isMobileApp } = useAppShell();
  const active = !isMobileApp && pathname === "/";

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle(BODY_DESKTOP_V4, active);
    return () => {
      document.body.classList.remove(BODY_DESKTOP_V4);
    };
  }, [active]);

  return null;
}