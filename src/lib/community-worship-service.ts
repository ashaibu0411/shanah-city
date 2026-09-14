import { denverWallClockToDate, getZonedDateParts } from "@/lib/denver-time";

export type CommunityStoryKind = "default" | "service_invite";

export type NextWorshipService = {
  id: "friday" | "sunday";
  title: string;
  scheduleLabel: string;
  inviteHeadline: string;
  startsAt: Date;
};

function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function weekdayForDateKey(dateKey: string) {
  return getZonedDateParts(denverWallClockToDate(dateKey, "12:00")).weekday;
}

/** Next Friday 7 PM or Sunday 10 AM worship (America/Denver). */
export function getNextWorshipService(reference = new Date()): NextWorshipService {
  const { dateKey } = getZonedDateParts(reference);
  const candidates: NextWorshipService[] = [];

  for (let offset = 0; offset < 14; offset += 1) {
    const key = addDaysToDateKey(dateKey, offset);
    const weekday = weekdayForDateKey(key);

    if (weekday === 5) {
      const startsAt = denverWallClockToDate(key, "19:00");
      if (startsAt.getTime() > reference.getTime() - 3 * 60 * 60 * 1000) {
        candidates.push({
          id: "friday",
          title: "Friday worship",
          scheduleLabel: "Friday 7:00 PM",
          inviteHeadline: "Who's going to Friday worship?",
          startsAt,
        });
      }
    }

    if (weekday === 0) {
      const startsAt = denverWallClockToDate(key, "10:00");
      if (startsAt.getTime() > reference.getTime() - 3 * 60 * 60 * 1000) {
        candidates.push({
          id: "sunday",
          title: "Sunday worship",
          scheduleLabel: "Sunday 10:00 AM",
          inviteHeadline: "Who's going to Sunday worship?",
          startsAt,
        });
      }
    }
  }

  candidates.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const next = candidates.find((entry) => entry.startsAt.getTime() >= reference.getTime() - 60 * 60 * 1000);

  return (
    next ?? {
      id: "friday",
      title: "Friday worship",
      scheduleLabel: "Friday 7:00 PM",
      inviteHeadline: "Who's going to Friday worship?",
      startsAt: denverWallClockToDate(addDaysToDateKey(dateKey, 7), "19:00"),
    }
  );
}

export function defaultServiceInviteCaption(reference = new Date()) {
  const service = getNextWorshipService(reference);
  return service.inviteHeadline;
}
