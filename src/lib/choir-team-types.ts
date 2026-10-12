export type ChoirTeamAssignmentStatus = "confirmed" | "assigned" | "past";

export type ChoirTeamAssignmentView = {
  id: string;
  planKey: string;
  serviceDate: string;
  serviceTime: string;
  title: string;
  dateTimeLabel: string;
  timeLabel: string;
  location: string;
  roleLabel: string;
  songCount: number;
  status: ChoirTeamAssignmentStatus;
  startsAtMs: number;
};

export type ChoirTeamMemberView = {
  userId: string;
  name: string;
  roleLabel: string;
  sectionLabel?: string;
  avatarUrl: string | null;
  isLeadership: boolean;
  profileHref: string;
};

export type ChoirTeamSectionGroup = {
  id: string;
  title: string;
  members: ChoirTeamMemberView[];
};

export type ChoirTeamPagePayload = {
  upcoming: ChoirTeamAssignmentView[];
  recent: ChoirTeamAssignmentView[];
  teamPreview: ChoirTeamMemberView[];
  teamMembers: ChoirTeamMemberView[];
  leadership: ChoirTeamMemberView[];
  vocalSections: ChoirTeamSectionGroup[];
  instrumentSections: ChoirTeamSectionGroup[];
  canManageRoster: boolean;
  canManageWorship: boolean;
  groupChatHref: string;
  manageRosterHref: string;
  managePlannerHref: string;
  availabilityHref: string;
};
