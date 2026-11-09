import type { GivingRecord } from "@/lib/giving-types";

/** Pure merge for member-visible history (privacy-safe). */
export function mergeMemberVisibleGivingRecords(
  memberId: string,
  byUserId: GivingRecord[],
  byEmail: GivingRecord[],
): GivingRecord[] {
  const merged = new Map<string, GivingRecord>();
  for (const record of byUserId) {
    merged.set(record.id, record);
  }
  for (const record of byEmail) {
    if (record.userId && record.userId !== memberId) {
      continue;
    }
    merged.set(record.id, record);
  }
  return [...merged.values()].sort(
    (left, right) =>
      right.givenOn.localeCompare(left.givenOn) ||
      right.createdAt.localeCompare(left.createdAt),
  );
}
