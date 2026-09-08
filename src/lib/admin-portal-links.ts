export type AdminPortalPermissions = {
  canManageAdmin: boolean;
  canReviewMinistryReports: boolean;
  canAccessFinance: boolean;
};

export const ADMIN_PORTAL_LINKS = [
  {
    href: "/admin/overview",
    label: "Overview",
    description: "Pastor dashboard",
    pastoralAllowed: true,
  },
  {
    href: "/admin/comms",
    label: "Comms",
    description: "Calendar and ministry requests",
    adminOnly: true,
  },
  {
    href: "/admin/approvals",
    label: "Approvals",
    description: "Ministry membership requests",
    adminOnly: true,
  },
  {
    href: "/admin/alerts",
    label: "Urgent",
    description: "Alert broadcasts",
    adminOnly: true,
  },
  {
    href: "/admin/guests",
    label: "Guests",
    description: "Visitor follow-up",
    adminOnly: true,
  },
  {
    href: "/admin/people",
    label: "People",
    description: "Member directory",
    adminOnly: true,
  },
  {
    href: "/admin/giving",
    label: "Giving",
    description: "Gifts and thank-yous",
    adminOnly: true,
    financeAllowed: true,
  },
  {
    href: "/admin/finance",
    label: "Finance",
    description: "Weekly counts and reports",
    financeOnly: true,
  },
  {
    href: "/admin/reports",
    label: "Reports",
    description: "Morning & evening clicks and leader reports",
    ministryManagementAllowed: true,
  },
] as const;

export function canAccessAdminPortal(permissions: AdminPortalPermissions) {
  return (
    permissions.canManageAdmin ||
    permissions.canReviewMinistryReports ||
    permissions.canAccessFinance
  );
}

export function filterAdminPortalLinks(permissions: AdminPortalPermissions) {
  return ADMIN_PORTAL_LINKS.filter((link) => {
    if ("financeOnly" in link && link.financeOnly) {
      return permissions.canAccessFinance;
    }
    if ("pastoralAllowed" in link && link.pastoralAllowed) {
      return permissions.canReviewMinistryReports;
    }
    if ("ministryManagementAllowed" in link && link.ministryManagementAllowed) {
      return permissions.canManageAdmin || permissions.canReviewMinistryReports;
    }
    if ("financeAllowed" in link && link.financeAllowed) {
      return permissions.canManageAdmin || permissions.canAccessFinance;
    }
    if ("adminOnly" in link && link.adminOnly) {
      return permissions.canManageAdmin;
    }
    return permissions.canManageAdmin;
  });
}
