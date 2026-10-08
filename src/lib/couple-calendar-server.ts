import type { PublicMember } from "@/lib/auth-types";
import { assertActiveCoupleWorkspace } from "@/lib/couple-workspace-access-server";
import { getActiveCoupleLinkForUserId } from "@/lib/couple-link-server";
import {
  buildStartEndIso,
  parseCategory,
  parseRecurrence,
  recordToPlannable,
  virtualAnniversaryPlannables,
} from "@/lib/couple-calendar-utils";
import type { CoupleCalendarPlannable } from "@/lib/couple-calendar-types";
import { useDatabase } from "@/lib/use-database";
import * as coupleCalendarDb from "@/lib/stores/couple-calendar-db";
import * as coupleCalendarJson from "@/lib/stores/couple-calendar-json";

const store = () => (useDatabase() ? coupleCalendarDb : coupleCalendarJson);

export async function getCoupleCalendarForUser(user: PublicMember) {
  const link = await assertActiveCoupleWorkspace(user);
  const records = await store().listCoupleCalendarEvents(link.id);
  const stored = records.map(recordToPlannable);

  const anniversaryDate = link.anniversaryDate?.trim();
  const virtual = anniversaryDate ? virtualAnniversaryPlannables(anniversaryDate) : [];

  const items: CoupleCalendarPlannable[] = [...stored, ...virtual];

  return {
    coupleLinkId: link.id,
    anniversaryDate: link.anniversaryDate,
    items,
    records,
  };
}

async function assertEventAccess(user: PublicMember, eventId: string) {
  const link = await assertActiveCoupleWorkspace(user);
  const event = await store().getCoupleCalendarEventById(eventId);
  if (!event || event.coupleLinkId !== link.id) {
    throw new Error("Event not found.");
  }
  return { link, event };
}

export async function createCoupleCalendarEventForUser(
  user: PublicMember,
  body: Record<string, unknown>,
) {
  const link = await assertActiveCoupleWorkspace(user);
  const title = String(body.title ?? "").trim();
  if (!title) throw new Error("Enter a title.");

  const dateKey = String(body.dateKey ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new Error("Choose a valid date.");
  }

  const allDay = body.allDay === true;
  const { startAt, endAt, timezone } = buildStartEndIso({
    dateKey,
    time: String(body.time ?? ""),
    endDateKey: String(body.endDateKey ?? "").trim() || undefined,
    endTime: String(body.endTime ?? "").trim() || undefined,
    allDay,
    timezone: String(body.timezone ?? "America/Denver"),
  });

  const reminderRaw = body.reminderMin;
  const reminderMin =
    reminderRaw === null || reminderRaw === "" || reminderRaw === undefined
      ? undefined
      : Number(reminderRaw);

  const record = await store().createCoupleCalendarEvent({
    coupleLinkId: link.id,
    createdBy: user.id,
    title,
    notes: String(body.notes ?? "").trim() || undefined,
    category: parseCategory(body.category),
    startAt,
    endAt,
    allDay,
    timezone,
    recurrence: parseRecurrence(body.recurrence),
    reminderMin: Number.isFinite(reminderMin) ? reminderMin : undefined,
  });

  return recordToPlannable(record);
}

export async function updateCoupleCalendarEventForUser(
  user: PublicMember,
  eventId: string,
  body: Record<string, unknown>,
) {
  await assertEventAccess(user, eventId);

  const title = body.title !== undefined ? String(body.title).trim() : undefined;
  if (title !== undefined && !title) throw new Error("Enter a title.");

  const patch: Parameters<typeof coupleCalendarDb.updateCoupleCalendarEvent>[1] = {};

  if (title !== undefined) patch.title = title;
  if (body.notes !== undefined) {
    patch.notes = String(body.notes).trim() || null;
  }
  if (body.category !== undefined) patch.category = parseCategory(body.category);
  if (body.allDay !== undefined) patch.allDay = body.allDay === true;
  if (body.recurrence !== undefined) patch.recurrence = parseRecurrence(body.recurrence);
  if (body.reminderMin !== undefined) {
    const value = body.reminderMin;
    patch.reminderMin =
      value === null || value === "" ? null : Number.isFinite(Number(value)) ? Number(value) : null;
  }

  if (body.dateKey !== undefined) {
    const dateKey = String(body.dateKey).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      throw new Error("Choose a valid date.");
    }
    const allDay = body.allDay === true || patch.allDay === true;
    const { startAt, endAt, timezone } = buildStartEndIso({
      dateKey,
      time: String(body.time ?? ""),
      endDateKey: String(body.endDateKey ?? "").trim() || undefined,
      endTime: String(body.endTime ?? "").trim() || undefined,
      allDay,
      timezone: String(body.timezone ?? "America/Denver"),
    });
    patch.startAt = startAt;
    patch.endAt = endAt ?? null;
    patch.timezone = timezone;
    patch.allDay = allDay;
  }

  const updated = await store().updateCoupleCalendarEvent(eventId, patch);
  return recordToPlannable(updated);
}

export async function deleteCoupleCalendarEventForUser(user: PublicMember, eventId: string) {
  await assertEventAccess(user, eventId);
  await store().deleteCoupleCalendarEvent(eventId);
}

export async function getCoupleLinkAnniversaryForUser(userId: string) {
  const link = await getActiveCoupleLinkForUserId(userId);
  return link?.anniversaryDate;
}
