import type { LeaderStudioTabId } from "@/lib/choir-leader-studio-types";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";

export function parseLeaderStudioTab(value: string | null): LeaderStudioTabId {
  if (
    value === "planning" ||
    value === "team" ||
    value === "events" ||
    value === "resources" ||
    value === "reports"
  ) {
    return value;
  }
  return "overview";
}

export function choirLeaderStudioHref(
  groupId: string = SHANAH_WORSHIP_GROUP_ID,
  tab?: LeaderStudioTabId,
) {
  const base = `/groups/${encodeURIComponent(groupId)}/studio`;
  if (!tab || tab === "overview") return base;
  const params = new URLSearchParams({ tab });
  return `${base}?${params.toString()}`;
}
