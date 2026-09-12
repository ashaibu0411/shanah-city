"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  adminNavItem,
  followUpNavItem,
  frontlinersNavItem,
  kidsMinistryNavItem,
  site,
  worshipNavItem,
  writeDevotionsNavItem,
  type AppNavItem,
} from "@/lib/site";
import { canAccessAdminPortal } from "@/lib/admin-portal-links";

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

    if (permissions.canAccessFrontLiners) {
      const profileIndex = items.findIndex((item) => item.href === "/profile");
      if (profileIndex === -1) {
        items = [...items, frontlinersNavItem];
      } else {
        items = [
          ...items.slice(0, profileIndex),
          frontlinersNavItem,
          ...items.slice(profileIndex),
        ];
      }
    }

    if (permissions.canAccessFollowUp) {
      const profileIndex = items.findIndex((item) => item.href === "/profile");
      if (profileIndex === -1) {
        items = [...items, followUpNavItem];
      } else {
        items = [
          ...items.slice(0, profileIndex),
          followUpNavItem,
          ...items.slice(profileIndex),
        ];
      }
    }

    if (permissions.canAccessKidsMinistry) {
      const profileIndex = items.findIndex((item) => item.href === "/profile");
      if (profileIndex === -1) {
        items = [...items, kidsMinistryNavItem];
      } else {
        items = [
          ...items.slice(0, profileIndex),
          kidsMinistryNavItem,
          ...items.slice(profileIndex),
        ];
      }
    }

    if (
      canAccessAdminPortal({
        canManageAdmin: permissions.canManageAdmin,
        canReviewMinistryReports: permissions.canReviewMinistryReports,
        canAccessFinance: permissions.canAccessFinance,
      })
    ) {
      const profileIndex = items.findIndex((item) => item.href === "/profile");
      if (profileIndex === -1) {
        items = [...items, adminNavItem];
      } else {
        items = [...items.slice(0, profileIndex), adminNavItem, ...items.slice(profileIndex)];
      }
    }

    return items;
  }, [
    permissions.canWriteDevotions,
    permissions.canAccessWorshipPlanner,
    permissions.canAccessFrontLiners,
    permissions.canAccessFollowUp,
    permissions.canAccessKidsMinistry,
    permissions.canManageAdmin,
    permissions.canReviewMinistryReports,
    permissions.canAccessFinance,
  ]);
}
