import type { ChoirWorshipEventsTabId } from "@/lib/choir-events-types";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";

export function choirWorshipEventsHref(
  groupId: string = SHANAH_WORSHIP_GROUP_ID,
  options?: { tab?: ChoirWorshipEventsTabId; view?: "upcoming" | "featured"; q?: string; category?: string },
) {
  const base = `/groups/${encodeURIComponent(groupId)}/events`;
  const params = new URLSearchParams();
  if (options?.tab && options.tab !== "events") params.set("tab", options.tab);
  if (options?.view) params.set("view", options.view);
  if (options?.q?.trim()) params.set("q", options.q.trim());
  if (options?.category?.trim() && options.category !== "all") {
    params.set("category", options.category.trim());
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function choirWorshipEventDetailHref(groupId: string, eventId: string) {
  return `/groups/${encodeURIComponent(groupId)}/events/${encodeURIComponent(eventId)}`;
}

export function choirWorshipEventsUpcomingHref(groupId: string = SHANAH_WORSHIP_GROUP_ID) {
  return choirWorshipEventsHref(groupId, { view: "upcoming" });
}

export function choirWorshipEventsFeaturedHref(groupId: string = SHANAH_WORSHIP_GROUP_ID) {
  return choirWorshipEventsHref(groupId, { view: "featured" });
}
