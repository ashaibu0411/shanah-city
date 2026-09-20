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

/** Live “who’s here” board hides at this hour (America/Denver), after morning service. */
export const VOLUNTEER_ARRIVAL_BOARD_CUTOFF_HOUR_DENVER = 14;

export function isVolunteerArrivalLiveBoardVisible(now = new Date()) {
  const { hour } = getZonedDateParts(now);
  return hour < VOLUNTEER_ARRIVAL_BOARD_CUTOFF_HOUR_DENVER;
}

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

/** After the live board closes, only return the signed-in member’s own today entry. */
export function filterVolunteerCheckInsForPublicSession(
  entries: VolunteerCheckIn[],
  user: { id: string; name: string },
  now = new Date(),
) {
  if (isVolunteerArrivalLiveBoardVisible(now)) {
    return entries;
  }
  const today = getZonedDateParts(now).dateKey;
  const nameKey = user.name.trim().toLowerCase();
  const expectedId = volunteerArrivalId(user.id, now);
  return entries.filter(
    (entry) =>
      volunteerArrivalDateKey(entry.checkedInAt) === today &&
      (entry.id === expectedId || entry.name.trim().toLowerCase() === nameKey),
  );
}

export function volunteerArrivalsForDateKey(
  entries: VolunteerCheckIn[],
  dateKey: string,
) {
  return entries
    .filter((entry) => volunteerArrivalDateKey(entry.checkedInAt) === dateKey)
    .sort(
      (left, right) =>
        new Date(left.checkedInAt).getTime() - new Date(right.checkedInAt).getTime(),
    );
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
