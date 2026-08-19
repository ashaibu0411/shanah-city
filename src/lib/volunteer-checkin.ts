import { getZonedDateParts } from "@/lib/denver-time";
import type { VolunteerCheckIn } from "@/lib/member-types";

export const VOLUNTEER_MINISTRIES = [
  "Usher",
  "Greeter",
  "Usher lead",
  "Parking",
  "Hospitality",
  "Kids Ministry",
  "Worship / Choir",
  "Media",
  "Prayer Ministry",
  "Security",
  "Pastors",
  "Other",
] as const;

export const FRONTLINER_ARRIVAL_TEAMS = VOLUNTEER_MINISTRIES;

export function volunteerArrivalDateKey(checkedInAt: string | Date) {
  return getZonedDateParts(
    typeof checkedInAt === "string" ? new Date(checkedInAt) : checkedInAt,
  ).dateKey;
}

export function todaysVolunteerArrivals(
  entries: VolunteerCheckIn[],
  now = new Date(),
) {
  const today = getZonedDateParts(now).dateKey;
  return entries
    .filter((entry) => volunteerArrivalDateKey(entry.checkedInAt) === today)
    .sort(
      (left, right) =>
        new Date(left.checkedInAt).getTime() - new Date(right.checkedInAt).getTime(),
    );
}

export function volunteerArrivalId(userId: string, now = new Date()) {
  return `${userId}-${getZonedDateParts(now).dateKey}`;
}

export function findTodaysVolunteerArrival(
  entries: VolunteerCheckIn[],
  user: { id: string; name: string },
  now = new Date(),
) {
  const today = getZonedDateParts(now).dateKey;
  const expectedId = volunteerArrivalId(user.id, now);
  return (
    entries.find((entry) => entry.id === expectedId) ??
    entries.find(
      (entry) =>
        volunteerArrivalDateKey(entry.checkedInAt) === today &&
        entry.name.trim().toLowerCase() === user.name.trim().toLowerCase(),
    )
  );
}
