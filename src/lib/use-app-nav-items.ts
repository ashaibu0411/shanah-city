"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { adminNavItem, site, worshipNavItem, writeDevotionsNavItem, type AppNavItem } from "@/lib/site";

export function useAppNavItems(): AppNavItem[] {
  const { permissions } = useAuth();

  return useMemo(() => {
    let items: AppNavItem[] = [...site.nav];

    if (permissions.canWriteDevotions) {
      const profileIndex = items.findIndex((item) => item.href === "/profile");
      if (profileIndex === -1) {
        items = [...items, writeDevotionsNavItem];
      } else {
        items = [
          ...items.slice(0, profileIndex),
          writeDevotionsNavItem,
          ...items.slice(profileIndex),
        ];
      }
    }

    if (permissions.canAccessWorshipPlanner) {
      const profileIndex = items.findIndex((item) => item.href === "/profile");
      if (profileIndex === -1) {
        items = [...items, worshipNavItem];
      } else {
        items = [
          ...items.slice(0, profileIndex),
          worshipNavItem,
          ...items.slice(profileIndex),
        ];
      }
    }

    if (permissions.canManageAdmin) {
      const profileIndex = items.findIndex((item) => item.href === "/profile");
      if (profileIndex === -1) {
        items = [...items, adminNavItem];
      } else {
        items = [...items.slice(0, profileIndex), adminNavItem, ...items.slice(profileIndex)];
      }
    }

    return items;
  }, [permissions.canWriteDevotions, permissions.canAccessWorshipPlanner, permissions.canManageAdmin]);
}
