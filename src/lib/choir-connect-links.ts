import type { ChoirConnectTabId } from "@/lib/choir-connect-types";

export function choirConnectHref(groupId: string, tab: ChoirConnectTabId = "home") {
  const base = `/groups/${encodeURIComponent(groupId)}/connect`;
  if (tab === "home") return base;
  return `${base}?tab=${encodeURIComponent(tab)}`;
}
