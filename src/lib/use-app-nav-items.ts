"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  adminNavItem,
  couplesNavItem,
  marriageCounselingNavItem,
  marriageCounselorAssignmentsNavItem,
  frontlinersNavItem,
  kidsMinistryNavItem,
  site,
  worshipNavItem,
  writeDevotionsNavItem,
  type AppNavItem,
} from "@/lib/site";
import { canAccessAdminPortal } from "@/lib/admin-portal-links";
import type { PublicMember } from "@/lib/auth-types";

type NavPermissions = {
  canWriteDevotions: boolean;
  canAccessWorshipPlanner: boolean;
  canAccessFrontLiners: boolean;
  canAccessKidsMinistry: boolean;
  canManageAdmin: boolean;
  canReviewMinistryReports: boolean;
  canAccessFinance: boolean;
  canAccessCouplesHub: boolean;
  canAccessMarriageCounselorAssignments: boolean;
};

function insertAfterGroups(items: AppNavItem[], ...toInsert: AppNavItem[]): AppNavItem[] {
  const groupsIndex = items.findIndex((item) => item.href === "/groups");
  if (groupsIndex === -1) {
    return [...items, ...toInsert];
  }
  return [
    ...items.slice(0, groupsIndex + 1),
    ...toInsert,
    ...items.slice(groupsIndex + 1),
  ];
}

/** Pure nav builder — used by sidebar, mobile More sheet, and tests. */
export function buildAppNavItems(
  user: PublicMember | null,
  permissions: NavPermissions,
): AppNavItem[] {
  let items: AppNavItem[] = [...site.nav];

  const afterGroups: AppNavItem[] = [marriageCounselingNavItem];
  if (user && permissions.canAccessCouplesHub) {
    afterGroups.unshift(couplesNavItem);
  }
  items = insertAfterGroups(items, ...afterGroups);

  if (user && permissions.canAccessMarriageCounselorAssignments) {
    const marriageIdx = items.findIndex((item) => item.href === marriageCounselingNavItem.href);
    if (marriageIdx >= 0) {
      items = [
        ...items.slice(0, marriageIdx + 1),
        marriageCounselorAssignmentsNavItem,
        ...items.slice(marriageIdx + 1),
      ];
    } else {
      items = [...items, marriageCounselorAssignmentsNavItem];
    }
  }

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
}

export function useAppNavItems(): AppNavItem[] {
  const { permissions, user } = useAuth();

  return useMemo(
    () => buildAppNavItems(user, permissions),
    [
      user,
      permissions.canWriteDevotions,
      permissions.canAccessWorshipPlanner,
      permissions.canAccessFrontLiners,
      permissions.canAccessKidsMinistry,
      permissions.canManageAdmin,
      permissions.canReviewMinistryReports,
      permissions.canAccessFinance,
      permissions.canAccessCouplesHub,
      permissions.canAccessMarriageCounselorAssignments,
    ],
  );
}
