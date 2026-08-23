import type { ChurchEvent } from "@/lib/types";
import {
  isEventRsvpAudience,
  type EventRsvpAudience,
  type EventRsvpFields,
} from "@/lib/event-rsvp-types";

export function parseEventRsvpFields(body: Record<string, unknown>): EventRsvpFields {
  const fields: EventRsvpFields = {};

  if (body.rsvpEnabled !== undefined) {
    fields.rsvpEnabled = body.rsvpEnabled === true;
  }

  if (body.rsvpAudience !== undefined) {
    const audience = String(body.rsvpAudience ?? "").trim();
    fields.rsvpAudience = isEventRsvpAudience(audience) ? audience : null;
  }

  if (body.rsvpGroupId !== undefined) {
    const groupId = String(body.rsvpGroupId ?? "").trim();
    fields.rsvpGroupId = groupId || null;
  }

  if (body.rsvpGroupName !== undefined) {
    const groupName = String(body.rsvpGroupName ?? "").trim();
    fields.rsvpGroupName = groupName || null;
  }

  if (body.rsvpDeadline !== undefined) {
    const deadline = String(body.rsvpDeadline ?? "").trim();
    fields.rsvpDeadline = deadline || null;
  }

  if (body.rsvpCapacity !== undefined) {
    const raw = body.rsvpCapacity;
    if (raw === "" || raw == null) {
      fields.rsvpCapacity = null;
    } else {
      const capacity = Number(raw);
      fields.rsvpCapacity = Number.isFinite(capacity) && capacity > 0 ? capacity : null;
    }
  }

  if (body.rsvpInstructions !== undefined) {
    const instructions = String(body.rsvpInstructions ?? "").trim();
    fields.rsvpInstructions = instructions || null;
  }

  return fields;
}

export function defaultRsvpAudienceForEvent(
  event: Pick<ChurchEvent, "groupId">,
): EventRsvpAudience {
  return event.groupId ? "group" : "church";
}

export function toLocalDeadlineInputValue(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function localDateTimeInputToIso(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function formatRsvpDeadlineLabel(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function daysUntilDeadline(iso?: string | null) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}
