"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

const BODY_CLASS = "community-v6-light-shell";

/** White mobile chrome (header + nav + main gutters) on /community only. */
export function CommunityV6LightShell() {
  const pathname = usePathname();
  const active = pathname === "/community" || pathname.startsWith("/community?");

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle(BODY_CLASS, active);
    return () => {
      document.body.classList.remove(BODY_CLASS);
    };
  }, [active]);

  return null;
}
