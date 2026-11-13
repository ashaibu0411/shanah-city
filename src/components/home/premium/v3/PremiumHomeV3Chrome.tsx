"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppShell } from "@/components/app/AppShellContext";

const BODY_V3 = "premium-home-v3-active";
const BODY_V4 = "premium-home-v4-active";

/** Premium Home V3 — approved deep indigo + violet + gold mobile home chrome. */
export function PremiumHomeV3Chrome() {
  const pathname = usePathname();
  const { isMobileApp } = useAppShell();
  const active = isMobileApp && pathname === "/";

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle(BODY_V3, active);
    document.body.classList.toggle(BODY_V4, active);
    return () => {
      document.body.classList.remove(BODY_V3);
      document.body.classList.remove(BODY_V4);
    };
  }, [active]);

  return null;
}
