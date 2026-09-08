import { getZonedDateParts } from "@/lib/denver-time";
import {
  groupItemsByDate,
  shiftMonth,
  type CalendarPlannable,
} from "@/lib/calendar-utils";

/** Pages that render their own hero/title below the sticky header on mobile. */
export function mobilePageHasBodyHero(pathname: string) {
  if (!pathname || pathname === "/") return false;
  if (pathname === "/profile") return false;
  if (pathname.startsWith("/groups/")) return false;

  if (pathname.startsWith("/devotions")) return true;
  if (pathname === "/live") return true;
  if (pathname === "/admin") return true;
  if (pathname.startsWith("/admin/")) return true;

  return true;
}

export function mobileHeaderShowsPageTitle(pathname: string) {
  if (pathname === "/") return false;
  return !mobilePageHasBodyHero(pathname);
}

export function nextUpcomingOccurrence<T extends CalendarPlannable>(
  items: T[],
  reference = new Date(),
): { item: T; isoDate: string } | null {
  if (items.length === 0) return null;

  const denver = getZonedDateParts(reference);
  const startYear = Number(denver.year);
  const startMonth = Number(denver.month) - 1;
  const todayKey = denver.dateKey;

  for (let offset = 0; offset < 4; offset += 1) {
    const cursor = shiftMonth(startYear, startMonth, offset);
    const byDate = groupItemsByDate(items, cursor.year, cursor.month);
    const dates = [...byDate.keys()].sort();

    for (const isoDate of dates) {
      if (isoDate < todayKey) continue;
      const dayItems = byDate.get(isoDate);
      if (!dayItems?.length) continue;
      return { item: dayItems[0], isoDate };
    }
  }

  return null;
}
