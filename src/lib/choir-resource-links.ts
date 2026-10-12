import type { ChoirResourceTabId } from "@/lib/choir-resource-types";

export function choirResourcesHref(groupId: string, tab: ChoirResourceTabId = "resources") {
  const base = `/groups/${encodeURIComponent(groupId)}/resources`;
  if (tab === "resources") return base;
  return `${base}?tab=${encodeURIComponent(tab)}`;
}

export function choirResourcesManageHref(groupId: string) {
  return `/groups/${encodeURIComponent(groupId)}/resources/manage`;
}

export function choirResourcesLibraryHref(groupId: string) {
  return `${choirResourcesHref(groupId, "resources")}?view=library`;
}
