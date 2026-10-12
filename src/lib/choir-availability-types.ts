import type { ChoirCalendarEvent } from "@/lib/choir-calendar-types";
import type { ChoirTeamAssignmentView } from "@/lib/choir-team-types";

export type ChoirAvailabilityResponse = "available" | "unavailable" | "maybe";

export type ChoirAvailabilityDisplayStatus = ChoirAvailabilityResponse | "not_responded";

export type ChoirAvailabilityTabId =
  | "home"
  | "schedule"
  | "my-schedule"
  | "upcoming"
  | "past"
  | "guidelines";

export type ChoirMyScheduleRehearsalView = {
  id: string;
  title: string;
  dateKey: string;
  timeLabel: string;
  dateTimeLabel: string;
  location: string;
  relatedServiceTitle: string;
  startsAtMs: number;
};

export type ChoirMyScheduleSummary = {
  upcomingCount: number;
  confirmedCount: number;
  awaitingConfirmationCount: number;
};

export type ChoirMyScheduleChangeRequestView = {
  id: string;
  status: ChoirScheduleChangeRequest["status"];
  reason: string;
  createdAt: string;
  eventTitle: string;
  requestType: ChoirScheduleChangeRequestType;
};

export type ChoirMySchedulePayload = {
  groupId: string;
  groupChatHref: string;
  summary: ChoirMyScheduleSummary;
  assignments: ChoirAvailabilityAssignmentPreview[];
  pastAssignments: ChoirTeamAssignmentView[];
  rehearsals: ChoirMyScheduleRehearsalView[];
  changeRequests: ChoirMyScheduleChangeRequestView[];
  /** @deprecated Use availability center for responses; kept for API compatibility */
  availabilitySubmitted?: ChoirAvailabilityOpportunityView[];
  availabilityAwaiting?: ChoirAvailabilityOpportunityView[];
};

export type ChoirAvailabilityConflictKind =
  | "unavailable_assigned"
  | "maybe_assigned"
  | "overlap"
  | "change_pending";

export type ChoirEventAvailabilityRecord = {
  groupId: string;
  eventId: string;
  memberId: string;
  response: ChoirAvailabilityResponse;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChoirAvailabilityPreferences = {
  groupId: string;
  memberId: string;
  preferredServiceTimes: string[];
  preferredRoles: string[];
  generalAvailability: "usually_available" | "usually_unavailable" | "varies";
  maxFrequency: "weekly" | "twice_monthly" | "monthly" | "flexible" | null;
  leadershipNotes?: string | null;
  updatedAt: string;
};

export type ChoirScheduleChangeRequestType =
  | "cannot_serve"
  | "request_swap"
  | "role_change"
  | "time_adjustment";

export type ChoirScheduleChangeRequest = {
  id: string;
  groupId: string;
  memberId: string;
  memberName: string;
  eventId: string;
  planKey?: string | null;
  assignmentRoleLabel?: string | null;
  requestType: ChoirScheduleChangeRequestType;
  reason: string;
  suggestedReplacement?: string | null;
  status: "pending" | "approved" | "declined";
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
};

export type ChoirAvailabilityStore = {
  responses: ChoirEventAvailabilityRecord[];
  preferences: ChoirAvailabilityPreferences[];
  changeRequests: ChoirScheduleChangeRequest[];
  eventDeadlines: Record<string, string>;
  guidelinesMarkdown: string | null;
};

export type ChoirAvailabilityOpportunityView = {
  event: ChoirCalendarEvent;
  availabilityStatus: ChoirAvailabilityDisplayStatus;
  availabilityLabel: string;
  responseDeadline: string | null;
  deadlinePassed: boolean;
  canEdit: boolean;
  conflicts: ChoirAvailabilityConflictKind[];
  memberNote?: string | null;
};

export type ChoirAvailabilityAssignmentPreview = ChoirTeamAssignmentView & {
  changeRequestPending: boolean;
};

export type ChoirAvailabilityHomePayload = {
  groupId: string;
  groupChatHref: string;
  canManage: boolean;
  teamAvailabilityHref: string | null;
  opportunities: ChoirAvailabilityOpportunityView[];
  assignmentPreview: ChoirAvailabilityAssignmentPreview[];
  scheduleTabHref: string;
  teamPageHref: string;
  summary: {
    awaiting: number;
    available: number;
    unavailable: number;
    maybe: number;
  };
};

export type ChoirAvailabilityCalendarDay = {
  dateKey: string;
  inMonth: boolean;
  isToday: boolean;
  events: ChoirAvailabilityOpportunityView[];
  dominantStatus: ChoirAvailabilityDisplayStatus | "mixed";
};

export const DEFAULT_AVAILABILITY_GUIDELINES = `## Availability Guidelines

### Why Availability Matters
Accurate availability helps leadership plan services, rehearsals, and team assignments responsibly.

### Respond Early
Submit availability as soon as you can so planners are not guessing.

### Be Accurate
Mark **Available** only when you are reasonably confident you can serve.

### If Your Plans Change
Update your availability promptly. If you are already assigned, submit a schedule change request rather than assuming the assignment was removed.

### Availability vs Assignment
Being available does not mean you are scheduled. Worship leadership still makes assignment decisions through the existing planner.

### Communication
Use Team Connect and established ministry channels for urgent changes.`;
