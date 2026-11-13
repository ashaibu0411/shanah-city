"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppShell } from "@/components/app/AppShellContext";

const BODY_V2 = "premium-home-v2-active";
/** Keeps shared mobile-home density + ph4 structure hooks from V4. */
const BODY_V4 = "premium-home-v4-active";

/** Premium Home V2 — brighter, higher-density mobile home chrome only. */
export function PremiumHomeV2Chrome() {
  const pathname = usePathname();
  const { isMobileApp } = useAppShell();
  const active = isMobileApp && pathname === "/";

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle(BODY_V2, active);
    document.body.classList.toggle(BODY_V4, active);
    return () => {
      document.body.classList.remove(BODY_V2);
      document.body.classList.remove(BODY_V4);
    };
  }, [active]);

  return null;
}
