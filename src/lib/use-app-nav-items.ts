"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { site, writeDevotionsNavItem } from "@/lib/site";

export function useAppNavItems() {
  const { permissions } = useAuth();

  return useMemo(() => {
    if (!permissions.canWriteDevotions) {
      return site.nav;
    }

    const profileIndex = site.nav.findIndex((item) => item.href === "/profile");
    if (profileIndex === -1) {
      return [...site.nav, writeDevotionsNavItem];
    }

    return [
      ...site.nav.slice(0, profileIndex),
      writeDevotionsNavItem,
      ...site.nav.slice(profileIndex),
    ];
  }, [permissions.canWriteDevotions]);
}
