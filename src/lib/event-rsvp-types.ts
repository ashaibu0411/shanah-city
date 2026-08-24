export type EventRsvpStatus = "going" | "not_going" | "maybe";
export type EventRsvpAudience = "church" | "group";

export type EventRsvpFields = {
  rsvpEnabled?: boolean;
  rsvpAudience?: EventRsvpAudience | null;
  rsvpGroupId?: string | null;
  rsvpGroupName?: string | null;
  rsvpDeadline?: string | null;
  rsvpCapacity?: number | null;
  rsvpInstructions?: string | null;
};

export type EventRsvpRecord = {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: EventRsvpStatus;
  note?: string;
  updatedAt: string;
  createdAt: string;
};

export type EventRsvpSummary = {
  going: number;
  notGoing: number;
  maybe: number;
  capacity: number | null;
  isFull: boolean;
};

export type EventRsvpRosterEntry = {
  userId: string;
  userName: string;
  status: EventRsvpStatus;
  note?: string;
  updatedAt: string;
};

export type EventRsvpView = {
  enabled: boolean;
  closed: boolean;
  audience: EventRsvpAudience | null;
  audienceGroupName?: string | null;
  deadline: string | null;
  instructions: string | null;
  myStatus: EventRsvpStatus | null;
  myNote: string | null;
  canRespond: boolean;
  canManage: boolean;
  inAudience: boolean;
  summary: EventRsvpSummary | null;
  roster: EventRsvpRosterEntry[] | null;
};

export const EVENT_RSVP_STATUSES: EventRsvpStatus[] = ["going", "not_going", "maybe"];

export function isEventRsvpStatus(value: string): value is EventRsvpStatus {
  return EVENT_RSVP_STATUSES.includes(value as EventRsvpStatus);
}

export function isEventRsvpAudience(value: string): value is EventRsvpAudience {
  return value === "church" || value === "group";
}

export type MyEventRsvpItem = {
  eventId: string;
  title: string;
  date: string;
  time: string;
  location: string;
  deadline: string | null;
  myStatus: EventRsvpStatus | null;
  needsResponse: boolean;
  groupName?: string | null;
};

export type MyEventRsvpsResponse = {
  pending: MyEventRsvpItem[];
  responded: MyEventRsvpItem[];
  pendingCount: number;
};

export function eventRsvpStatusLabel(status: EventRsvpStatus) {
  switch (status) {
    case "going":
      return "Going";
    case "maybe":
      return "Maybe";
    case "not_going":
      return "Can't go";
  }
}
