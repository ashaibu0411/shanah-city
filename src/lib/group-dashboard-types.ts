export type GroupScheduleKind = "worship" | "frontliners" | "roster" | "followUp" | "generic";

export type GroupDashboardRoleRow = {
  roleLabel: string;
  assignees: string[];
};

export type GroupDashboardNextService = {
  title: string;
  subtitle?: string;
  roles: GroupDashboardRoleRow[];
  href?: string;
  emptyMessage?: string;
};

export type GroupDashboardAssignment = {
  id: string;
  leftLabel: string;
  rightLabel: string;
  href?: string;
};

export type GroupDashboardQuickAction = {
  id: string;
  label: string;
  href?: string;
  action?: "chat" | "calendar" | "report" | "invite" | "roster" | "guests";
};

export type GroupDashboardData = {
  scheduleKind: GroupScheduleKind;
  nextService: GroupDashboardNextService | null;
  myAssignments: GroupDashboardAssignment[];
  quickActions: GroupDashboardQuickAction[];
  canManageRoster?: boolean;
  usesServiceRoster?: boolean;
};

export type GroupsThisSundayAssignment = {
  groupId: string;
  groupName: string;
  leftLabel: string;
  rightLabel: string;
  href: string;
};

export type GroupsThisSundayService = {
  groupId: string;
  groupName: string;
  title: string;
  subtitle?: string;
  href?: string;
};

export type GroupsThisSundaySummary = {
  assignments: GroupsThisSundayAssignment[];
  teamServices: GroupsThisSundayService[];
};
