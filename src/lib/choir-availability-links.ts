import type { ChoirAvailabilityTabId } from "@/lib/choir-availability-types";

export function choirAvailabilityHref(groupId: string, tab?: ChoirAvailabilityTabId) {
  const base = `/groups/${encodeURIComponent(groupId)}/availability`;
  if (!tab || tab === "home") return base;
  const params = new URLSearchParams({ tab });
  return `${base}?${params.toString()}`;
}

export function choirAvailabilityTeamHref(groupId: string) {
  return `/groups/${encodeURIComponent(groupId)}/availability/team`;
}
