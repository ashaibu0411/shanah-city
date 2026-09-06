import type { CommsCalendarItem, CommsRequest } from "@/lib/comms-types";

export function isPendingCommsApproval(request: CommsRequest) {
  return request.status === "pending_approval" || request.status === "submitted";
}

export function canScheduleCommsRequest(request: CommsRequest) {
  return request.status === "approved" && !request.calendarItemId;
}

export function canPromoteCommsCalendarItem(item: CommsCalendarItem) {
  return item.status === "scheduled" && Boolean(item.scheduledDate);
}

export function scheduleCommsRequestError(request: CommsRequest) {
  if (request.calendarItemId) {
    return "This request is already on the calendar.";
  }
  if (request.status !== "approved") {
    return "Approve this request before scheduling it on the calendar.";
  }
  return null;
}

export function promoteCommsCalendarItemError(item: CommsCalendarItem) {
  if (item.status === "published") {
    return "This item was already published.";
  }
  if (!item.scheduledDate || item.status !== "scheduled") {
    return "Schedule this item on the calendar before promoting to the app.";
  }
  return null;
}
