export type CommsRequestStatus =
  | "submitted"
  | "pending_approval"
  | "approved"
  | "in_progress"
  | "done"
  | "on_hold";

export type CommsRequestTemplate = "media" | "worship" | "communications" | "general";

export type CommsChannelId =
  | "service_announcement"
  | "instagram"
  | "facebook"
  | "email"
  | "newsletter"
  | "app_banner"
  | "push";

export type CommsCalendarStatus = "planned" | "draft" | "scheduled" | "published";

export type CommsPromotedAs = {
  urgentAlertId?: string;
  communityPostId?: string;
  pushSentAt?: string;
};

export type CommsRequest = {
  id: string;
  template: CommsRequestTemplate;
  title: string;
  department?: string;
  description: string;
  targetAudience?: string;
  deliverables: string[];
  dueDate?: string;
  status: CommsRequestStatus;
  assigneeId?: string;
  assigneeName?: string;
  requesterId: string;
  requesterName: string;
  requesterEmail?: string;
  calendarItemId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CommsCalendarItem = {
  id: string;
  title: string;
  channel: CommsChannelId;
  weekStart: string;
  scheduledDate?: string;
  status: CommsCalendarStatus;
  color?: string;
  body?: string;
  requestId?: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  promotedAs?: CommsPromotedAs;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};
