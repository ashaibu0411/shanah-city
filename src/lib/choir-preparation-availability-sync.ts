import type { PublicMember } from "@/lib/auth-types";
import { buildChoirCalendarPagePayload } from "@/lib/choir-calendar-server";
import type { ChoirCalendarEvent } from "@/lib/choir-calendar-types";
import { setChoirPreparationChecked } from "@/lib/choir-preparation-server";
import { listChoirAvailabilityResponsesForMemberJson } from "@/lib/stores/choir-availability-json";

export function planKeyForCalendarEvent(event: ChoirCalendarEvent): string | null {
  const worshipPlanKey = event.worshipPlanKey?.trim();
  if (worshipPlanKey) return worshipPlanKey;
  if (event.sourceType === "worship-plan" || event.sourceType === "worship-rehearsal") {
    return event.sourceId?.trim() || null;
  }
  return null;
}

export async function userHasAvailabilityResponseForPlan(
  user: PublicMember,
  groupId: string,
  planKey: string,
): Promise<boolean> {
  const calendar = await buildChoirCalendarPagePayload(user, groupId);
  if (!calendar) return false;

  const eventIds = new Set(
    calendar.events
      .filter((event) => planKeyForCalendarEvent(event) === planKey)
      .map((event) => event.id),
  );
  if (eventIds.size === 0) return false;

  const responses = await listChoirAvailabilityResponsesForMemberJson(groupId, user.id);
  return responses.some((row) => eventIds.has(row.eventId));
}

export async function markPreparationAvailabilityForEvent(
  userId: string,
  event: ChoirCalendarEvent,
) {
  const planKey = planKeyForCalendarEvent(event);
  if (!planKey) return;
  await setChoirPreparationChecked(userId, planKey, "availability", true);
}
