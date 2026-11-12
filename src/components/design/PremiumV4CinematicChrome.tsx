"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppShell } from "@/components/app/AppShellContext";
import { premiumV4ThemeForPath } from "@/lib/premium-v4-design-system";

const BODY_CLASS = "premium-v4-cinematic-active";

/** Mobile header + bottom nav on V4 cinematic routes (live, sermons, community). */
export function PremiumV4CinematicChrome() {
  const pathname = usePathname();
  const { isMobileApp } = useAppShell();
  const active = isMobileApp && premiumV4ThemeForPath(pathname) === "cinematic";

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle(BODY_CLASS, active);
    return () => {
      document.body.classList.remove(BODY_CLASS);
    };
  }, [active]);

  return null;
}
