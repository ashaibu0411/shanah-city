import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";

export type ChoirRecordingsLibraryTab = "library" | "record";

/** Canonical Shanah Worship recording library (rehearsal room). */
export function choirRecordingsLibraryHref(
  groupId: string = SHANAH_WORSHIP_GROUP_ID,
  options?: { tab?: ChoirRecordingsLibraryTab; filter?: "mine" },
): string {
  const params = new URLSearchParams();
  params.set("tab", options?.tab ?? "library");
  if (options?.filter === "mine") params.set("filter", "mine");
  return `/groups/${encodeURIComponent(groupId)}/rehearsal?${params.toString()}`;
}
