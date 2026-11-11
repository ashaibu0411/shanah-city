import { worshipPlannerPath, worshipServiceDetailPath } from "@/lib/worship-plan-links";
import { isGroupScheduleCalendarEventId } from "@/lib/choir-service-schedule-types";
import {
  WORSHIP_SERVICE_SCHEDULE,
  WORSHIP_SERVICE_TIMES,
  serviceDateTimeLabel,
  worshipTimeLabel,
  type WorshipServicePlan,
} from "@/lib/worship-types";

export type WorshipPlannerDayTarget = {
  serviceDate: string;
  serviceTime: string;
  label: string;
};

type CalendarDayItem = {
  id: string;
  title: string;
  startsOn?: string | null;
  time?: string | null;
};

/** Map planner storage times (09:00) or labels (9:00 AM) to canonical slot values. */
export function coerceWorshipServiceTime(raw?: string | null): string {
  const trimmed = raw?.trim();
  if (!trimmed) return "10:00";

  const direct = WORSHIP_SERVICE_TIMES.find((slot) => slot.value === trimmed);
  if (direct) return direct.value;

  const fromSchedule = WORSHIP_SERVICE_SCHEDULE.find(
    (slot) => slot.label.toLowerCase() === trimmed.toLowerCase(),
  );
  if (fromSchedule) return fromSchedule.value;

  const twelveHour = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (twelveHour) {
    let hour = Number(twelveHour[1]);
    const minute = twelveHour[2];
    const period = twelveHour[3].toUpperCase();
    if (period === "PM" && hour < 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    const value = `${String(hour).padStart(2, "0")}:${minute}`;
    if (WORSHIP_SERVICE_TIMES.some((slot) => slot.value === value)) return value;
  }

  const twentyFour = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    const value = `${String(Number(twentyFour[1])).padStart(2, "0")}:${twentyFour[2]}`;
    if (WORSHIP_SERVICE_TIMES.some((slot) => slot.value === value)) return value;
  }

  return "10:00";
}

export function pickWorshipPlanForServiceDate(
  plans: WorshipServicePlan[],
  serviceDate: string,
  options?: {
    serviceTime?: string | null;
    eventTimeLabel?: string | null;
    /** Prefer a published plan when several slots exist on the same Sunday. */
    preferPublished?: boolean;
  },
): WorshipServicePlan | null {
  if (!serviceDate.trim()) return null;
  const onDate = plans.filter((plan) => plan.serviceDate === serviceDate);
  if (onDate.length === 0) return null;

  const label = options?.eventTimeLabel?.trim();
  if (label) {
    const byLabel = onDate.find((plan) => worshipTimeLabel(plan.serviceTime) === label);
    if (byLabel) return byLabel;
    const coercedFromLabel = coerceWorshipServiceTime(label);
    const byCoercedLabel = onDate.find((plan) => plan.serviceTime === coercedFromLabel);
    if (byCoercedLabel) return byCoercedLabel;
  }

  const coerced = coerceWorshipServiceTime(options?.serviceTime);
  const exact = onDate.find((plan) => plan.serviceTime === coerced);
  if (exact) return exact;

  if (onDate.length === 1) return onDate[0];

  if (options?.preferPublished !== false) {
    const published = onDate.filter((plan) => plan.status === "published");
    if (published.length === 1) return published[0];
    const publishedAtCoerced = published.find((plan) => plan.serviceTime === coerced);
    if (publishedAtCoerced) return publishedAtCoerced;
  }

  const defaultSlot = onDate.find((plan) => plan.serviceTime === coerced);
  if (defaultSlot) return defaultSlot;

  return onDate[0] ?? null;
}

export function worshipPlannerHrefForService(
  serviceDate: string,
  plans: WorshipServicePlan[],
  options: {
    eventTimeLabel?: string | null;
    serviceTime?: string | null;
    canManagePlan: boolean;
    preferPublished?: boolean;
  },
): string | null {
  if (!serviceDate.trim()) return null;

  const matchedPlan = pickWorshipPlanForServiceDate(plans, serviceDate, {
    eventTimeLabel: options.eventTimeLabel,
    serviceTime: options.serviceTime,
    preferPublished: options.preferPublished ?? !options.canManagePlan,
  });
  const serviceTime =
    matchedPlan?.serviceTime ??
    coerceWorshipServiceTime(options.eventTimeLabel?.trim() || options.serviceTime || null);

  if (matchedPlan || options.canManagePlan) {
    return worshipPlannerPath({ serviceDate, serviceTime });
  }

  return null;
}

export function worshipPlansOnDate(plans: WorshipServicePlan[], isoDate: string) {
  if (!isoDate.trim()) return [];
  return plans.filter((plan) => plan.serviceDate === isoDate);
}

export function worshipDetailHrefForPlan(
  plan: WorshipServicePlan,
  canManagePlan: boolean,
) {
  return worshipServiceDetailPath(plan, canManagePlan);
}

/** When exactly one visible plan exists on a date, open it; otherwise return null. */
export function worshipAutoOpenHrefForDate(
  plans: WorshipServicePlan[],
  isoDate: string,
  canManagePlan: boolean,
) {
  const onDate = worshipPlansOnDate(plans, isoDate);
  if (onDate.length !== 1) return null;
  return worshipDetailHrefForPlan(onDate[0]!, canManagePlan);
}

/** Worship plans and synced service-schedule calendar events on one day. */
export function worshipPlannerDayTargets(
  isoDate: string,
  plans: WorshipServicePlan[],
  calendarItems: CalendarDayItem[] = [],
): WorshipPlannerDayTarget[] {
  if (!isoDate.trim()) return [];

  const targets: WorshipPlannerDayTarget[] = [];
  const seen = new Set<string>();

  const addTarget = (serviceDate: string, serviceTime: string, label: string) => {
    const key = `${serviceDate}|${serviceTime}`;
    if (seen.has(key)) return;
    seen.add(key);
    targets.push({ serviceDate, serviceTime, label });
  };

  for (const plan of worshipPlansOnDate(plans, isoDate)) {
    addTarget(
      plan.serviceDate,
      plan.serviceTime,
      plan.title?.trim() || serviceDateTimeLabel(plan.serviceDate, plan.serviceTime),
    );
  }

  for (const item of calendarItems) {
    if (!isGroupScheduleCalendarEventId(item.id)) continue;
    const serviceDate = item.startsOn?.trim();
    if (!serviceDate || serviceDate !== isoDate) continue;
    const serviceTime = coerceWorshipServiceTime(item.time);
    addTarget(
      serviceDate,
      serviceTime,
      item.title.trim() || serviceDateTimeLabel(serviceDate, serviceTime),
    );
  }

  return targets.sort((left, right) => left.serviceTime.localeCompare(right.serviceTime));
}

export function worshipPlannerHrefForDayTarget(
  target: WorshipPlannerDayTarget,
  plans: WorshipServicePlan[],
  canManagePlan: boolean,
) {
  const href = worshipPlannerHrefForService(target.serviceDate, plans, {
    serviceTime: target.serviceTime,
    eventTimeLabel: worshipTimeLabel(target.serviceTime),
    canManagePlan,
  });
  if (href) return href;
  if (canManagePlan) {
    return worshipServiceDetailPath(target, canManagePlan);
  }
  return null;
}

/** One linked service on this day → open planner; otherwise null (picker or normal day panel). */
export function worshipAutoOpenHrefForCalendarDay(
  isoDate: string,
  plans: WorshipServicePlan[],
  calendarItems: CalendarDayItem[],
  canManagePlan: boolean,
) {
  const targets = worshipPlannerDayTargets(isoDate, plans, calendarItems);
  if (targets.length !== 1) return null;
  return worshipPlannerHrefForDayTarget(targets[0]!, plans, canManagePlan);
}

export function dayHasWorshipPlannerLink(
  isoDate: string,
  plans: WorshipServicePlan[],
  calendarItems: CalendarDayItem[],
) {
  return worshipPlannerDayTargets(isoDate, plans, calendarItems).length > 0;
}
