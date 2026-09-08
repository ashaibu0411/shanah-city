import { SHANAH_POWER_COUPLES_GROUP_ID } from "@/lib/church-groups";
import type { ChurchEvent } from "@/lib/types";

export function isEventCouplesRsvpMode(
  event: Pick<ChurchEvent, "rsvpCouplesMode" | "groupId">,
) {
  if (event.rsvpCouplesMode) return true;
  return event.groupId === SHANAH_POWER_COUPLES_GROUP_ID;
}

export function normalizeGuestCount(value: unknown, couplesMode: boolean) {
  const count = Number(value);
  if (!Number.isFinite(count)) return 1;
  const rounded = Math.round(count);
  if (couplesMode) {
    return rounded >= 2 ? 2 : 1;
  }
  return 1;
}

export function goingHeadcount(
  rsvps: Array<{ status: string; guestCount?: number }>,
) {
  return rsvps
    .filter((entry) => entry.status === "going")
    .reduce((sum, entry) => sum + (entry.guestCount ?? 1), 0);
}

export function formatRsvpRosterName(entry: {
  userName: string;
  guestCount?: number;
  spouseName?: string;
}) {
  if ((entry.guestCount ?? 1) >= 2) {
    if (entry.spouseName?.trim()) {
      return `${entry.userName} & ${entry.spouseName.trim()}`;
    }
    return `${entry.userName} (+ spouse)`;
  }
  return entry.userName;
}
