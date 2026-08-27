import type { GroupCategory, GroupVisibility } from "@/lib/group-types";

export const ADMIN_GROUP_ID = "group-admin";
export const TEAM_ZNCF_GROUP_ID = "group-team-zncf";

export const CALENDAR_GROUP_TABS = {
  choir: "group-choir",
  pastors: "group-pastors",
} as const;

export type ChurchGroupSeed = {
  id: string;
  name: string;
  description: string;
  category: GroupCategory;
  visibility: GroupVisibility;
  requiresApproval: boolean;
  signupVisible: boolean;
  isSystem: boolean;
};

export const CHURCH_MINISTRY_GROUPS: ChurchGroupSeed[] = [
  {
    id: ADMIN_GROUP_ID,
    name: "Admin Group",
    description:
      "Church administrators with full access to calendar, member tools, and approvals.",
    category: "other",
    visibility: "private",
    requiresApproval: true,
    signupVisible: true,
    isSystem: true,
  },
  {
    id: "group-pastors",
    name: "Pastors",
    description: "Pastoral team members and shepherds.",
    category: "ministry",
    visibility: "private",
    requiresApproval: true,
    signupVisible: false,
    isSystem: true,
  },
  {
    id: TEAM_ZNCF_GROUP_ID,
    name: "Team ZNCF",
    description: "Private devotion writers who draft and publish daily devotions.",
    category: "other",
    visibility: "private",
    requiresApproval: true,
    signupVisible: false,
    isSystem: true,
  },
  {
    id: "group-leaders",
    name: "Leaders",
    description: "Ministry and service leaders across the church.",
    category: "ministry",
    visibility: "private",
    requiresApproval: true,
    signupVisible: true,
    isSystem: true,
  },
  {
    id: "group-team-lead",
    name: "Team Lead",
    description: "Backend and operations team leads.",
    category: "other",
    visibility: "private",
    requiresApproval: true,
    signupVisible: true,
    isSystem: true,
  },
  {
    id: "group-finance",
    name: "Finance Team",
    description: "Treasury counters who record weekly offering totals.",
    category: "other",
    visibility: "private",
    requiresApproval: true,
    signupVisible: true,
    isSystem: true,
  },
  {
    id: "group-frontliners",
    name: "FrontLiners",
    description: "Sunday service teams — ushers, greeters, and door volunteers.",
    category: "ministry",
    visibility: "public",
    requiresApproval: false,
    signupVisible: true,
    isSystem: true,
  },
  {
    id: "group-ushering",
    name: "Ushering Ministry",
    description: "Ushers and greeters who welcome guests and serve during worship.",
    category: "ministry",
    visibility: "public",
    requiresApproval: false,
    signupVisible: true,
    isSystem: true,
  },
  {
    id: "group-prayer",
    name: "Prayer Ministry",
    description: "Intercessors and prayer team.",
    category: "ministry",
    visibility: "public",
    requiresApproval: false,
    signupVisible: true,
    isSystem: true,
  },
  {
    id: "group-shanah-ladies",
    name: "Shanah Ladies",
    description: "Women's ministry fellowship and events.",
    category: "ministry",
    visibility: "public",
    requiresApproval: false,
    signupVisible: true,
    isSystem: true,
  },
  {
    id: "group-men-legacy",
    name: "Men of Legacy",
    description: "Men's ministry and discipleship.",
    category: "ministry",
    visibility: "public",
    requiresApproval: false,
    signupVisible: true,
    isSystem: true,
  },
  {
    id: "group-teens",
    name: "Teens",
    description: "Teen ministry and youth gatherings.",
    category: "youth",
    visibility: "public",
    requiresApproval: false,
    signupVisible: true,
    isSystem: true,
  },
  {
    id: "group-kids",
    name: "Shanah Kids Ministry",
    description: "Children's ministry volunteers and helpers.",
    category: "youth",
    visibility: "public",
    requiresApproval: false,
    signupVisible: true,
    isSystem: true,
  },
  {
    id: "group-choir",
    name: "Shanah Worship (Choir)",
    description: "Worship team and choir — access the worship planner, setlists, and schedules.",
    category: "choir",
    visibility: "public",
    requiresApproval: false,
    signupVisible: true,
    isSystem: true,
  },
  {
    id: "group-young-adults",
    name: "Young Adults Ministry",
    description: "Young adult fellowship and growth.",
    category: "youth",
    visibility: "public",
    requiresApproval: false,
    signupVisible: true,
    isSystem: true,
  },
];

export function getSignupMinistryGroups() {
  return CHURCH_MINISTRY_GROUPS.filter((group) => group.signupVisible);
}

export function isPrivilegedMinistryGroup(groupId: string) {
  const group = CHURCH_MINISTRY_GROUPS.find((entry) => entry.id === groupId);
  return group?.requiresApproval ?? false;
}

export const GROUP_CALENDAR_EXCLUDED_IDS = new Set([
  ADMIN_GROUP_ID,
  TEAM_ZNCF_GROUP_ID,
  "group-leaders",
  "group-team-lead",
]);

export function groupHasEmbeddedCalendar(group: {
  id: string;
  name: string;
  category: ChurchGroupSeed["category"];
}) {
  if (GROUP_CALENDAR_EXCLUDED_IDS.has(group.id)) {
    return false;
  }
  if (CHURCH_MINISTRY_GROUPS.some((seed) => seed.id === group.id)) {
    return true;
  }
  return ["ministry", "choir", "youth", "small-group"].includes(group.category);
}

export function unavailabilityCalendarGroupForId(
  groupId: string,
): keyof typeof CALENDAR_GROUP_TABS | null {
  if (groupId === CALENDAR_GROUP_TABS.choir) return "choir";
  if (groupId === CALENDAR_GROUP_TABS.pastors) return "pastors";
  return null;
}
