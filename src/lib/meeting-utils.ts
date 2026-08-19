import type { Meeting } from "@/lib/types";

export function parseRecurringWeekdays(
  value?: string | number[] | null,
): number[] | undefined {
  if (Array.isArray(value)) {
    const weekdays = value.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
    return weekdays.length > 0 ? weekdays : undefined;
  }

  if (!value?.trim()) return undefined;

  const weekdays = value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);

  return weekdays.length > 0 ? weekdays : undefined;
}

export function serializeRecurringWeekdays(
  value?: number[] | null,
): string | null {
  const weekdays = parseRecurringWeekdays(value);
  return weekdays ? weekdays.join(",") : null;
}

export function meetingHasJoinLink(meeting: Pick<Meeting, "platform" | "joinUrl">) {
  if (meeting.platform === "in-person") return false;
  const joinUrl = meeting.joinUrl?.trim() ?? "";
  if (!joinUrl) return false;
  return !joinUrl.toLowerCase().includes("shanahcity.org/contact");
}
