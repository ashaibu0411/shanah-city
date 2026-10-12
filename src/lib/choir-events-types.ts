import type { EventRsvpStatus } from "@/lib/event-rsvp-types";
import type { ChurchEvent } from "@/lib/types";

export type ChoirWorshipEventsTabId =
  | "events"
  | "registrations"
  | "teams"
  | "past"
  | "guidelines";

export type WorshipEventCategory =
  | "worship_night"
  | "concert"
  | "conference"
  | "training"
  | "intensive"
  | "retreat"
  | "gathering"
  | "celebration"
  | "other";

export type WorshipEventRegistrationStatus =
  | "not_required"
  | "open"
  | "closed"
  | "full"
  | "registered"
  | "canceled";

export type ChoirEventTeamInterestStatus =
  | "interested"
  | "pending_review"
  | "approved"
  | "assigned"
  | "declined";

export type ChoirWorshipEventMeta = {
  eventId: string;
  /** Include a church-wide event on the worship events page. */
  includeOnWorshipEvents?: boolean;
  category?: WorshipEventCategory;
  featuredOrder?: number | null;
  audienceLabel?: string | null;
  shortDescription?: string | null;
  teamVolunteerOpen?: boolean;
  teamRoles?: string[];
  teamDeadline?: string | null;
  recapSummary?: string | null;
  recapPhotoUrls?: string[];
  recapVideoUrls?: string[];
  canceledAt?: string | null;
};

export type ChoirEventTeamInterest = {
  id: string;
  groupId: string;
  eventId: string;
  userId: string;
  userName: string;
  preferredRole?: string | null;
  note?: string | null;
  status: ChoirEventTeamInterestStatus;
  createdAt: string;
  updatedAt: string;
};

export type ChoirWorshipEventsStore = {
  eventMeta: ChoirWorshipEventMeta[];
  teamInterests: ChoirEventTeamInterest[];
  guidelinesMarkdown: string | null;
};

export type WorshipEventCardView = {
  id: string;
  title: string;
  category: WorshipEventCategory;
  categoryLabel: string;
  dateKey: string;
  monthLabel: string;
  dayLabel: string;
  weekdayLabel: string;
  timeLabel: string;
  endTimeLabel: string | null;
  location: string;
  audienceLabel: string;
  imageUrl: string;
  shortDescription: string;
  registrationStatus: WorshipEventRegistrationStatus;
  registrationLabel: string;
  featured: boolean;
  detailHref: string;
  startsAtMs: number;
  rsvpEnabled: boolean;
};

export type WorshipEventRegistrationCardView = {
  eventId: string;
  title: string;
  imageUrl: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  status: EventRsvpStatus | null;
  statusLabel: string;
  guestCount: number | null;
  detailHref: string;
};

export type WorshipEventTeamOpportunityView = {
  eventId: string;
  title: string;
  dateLabel: string;
  teamLabel: string;
  roles: string[];
  deadlineLabel: string | null;
  myStatus: ChoirEventTeamInterestStatus | null;
  detailHref: string;
};

export type ChoirWorshipEventsHomePayload = {
  groupId: string;
  groupChatHref: string;
  canManageEvents: boolean;
  manageEventsHref: string;
  featured: WorshipEventCardView | null;
  upcoming: WorshipEventCardView[];
  featuredCount: number;
  upcomingCount: number;
};

export type ChoirWorshipEventDetailPayload = {
  rsvpEvent: ChurchEvent;
  event: WorshipEventCardView;
  description: string;
  organizerLabel: string;
  deadlineLabel: string | null;
  capacityLabel: string | null;
  rsvpInstructions: string | null;
  myRsvpStatus: EventRsvpStatus | null;
  myGuestCount: number | null;
  canRegister: boolean;
  canManageRsvp: boolean;
  shareUrl: string;
  teamVolunteerOpen: boolean;
  myTeamStatus: ChoirEventTeamInterestStatus | null;
  recapSummary: string | null;
  recapPhotoUrls: string[];
  recapVideoUrls: string[];
  worshipPlanHref: string | null;
  setlistHref: string | null;
  rehearsalHref: string | null;
};

export const DEFAULT_WORSHIP_EVENT_GUIDELINES = `# Worship event guidelines

## Preparing for worship events
Review event details, location, and any preparation notes from worship leadership before you arrive.

## Registration
Register only when an event requires it. Follow RSVP instructions and deadlines shown on the event.

## Serving at events
Serving roles and stage assignments are coordinated by authorized worship leadership—not through event registration alone.

## Rehearsals
Assigned team members should confirm availability and review rehearsal materials linked from the worship calendar and rehearsal room.

## Communication
Use official Team Connect and group channels for event updates. Avoid sharing private team details publicly.

## Schedule changes
If you can no longer serve on an assigned team, submit a schedule change through the Availability Center.

## Event conduct
Represent Shanah Worship with excellence, humility, and unity. Honor leadership direction and respect fellow team members.
`;
