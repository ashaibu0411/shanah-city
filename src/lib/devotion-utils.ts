import type { Devotion } from "@/lib/types";
import { denverWallClockToDate, getZonedDateParts } from "@/lib/denver-time";

export type DevotionPublishMode = "now" | "schedule" | "draft";

export function estimateReadingTime(parts: {
  verse?: string;
  content?: string;
  prayer?: string;
}) {
  const stripMarkers = (value: string) => value.replace(/[*_]/g, "");
  const text = [parts.verse, parts.content, parts.prayer]
    .filter(Boolean)
    .map((part) => stripMarkers(part ?? ""))
    .join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 180));
  return `${minutes} min`;
}

export function formatDisplayDateFromInput(dateInput: string) {
  const [year, month, day] = dateInput.split("-").map(Number);
  if (!year || !month || !day) {
    return dateInput;
  }
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function toDateInputValue(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return getZonedDateParts(date).dateKey;
}

export function toTimeInputValue(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "06:00";
  }
  const zoned = getZonedDateParts(date);
  return `${String(zoned.hour).padStart(2, "0")}:${String(zoned.minute).padStart(2, "0")}`;
}

export function combineScheduleInputs(dateInput: string, timeInput: string) {
  return denverWallClockToDate(dateInput, timeInput);
}

export function defaultScheduleDateInput() {
  return getZonedDateParts().dateKey;
}

export function isDevotionPubliclyVisible(devotion: Devotion, now = new Date()) {
  if (devotion.published === false) {
    return false;
  }
  if (!devotion.publishAt) {
    return true;
  }
  return new Date(devotion.publishAt) <= now;
}

export function getDevotionStatus(
  devotion: Devotion,
  now = new Date(),
): "draft" | "scheduled" | "live" {
  if (devotion.published === false) {
    return "draft";
  }
  if (devotion.publishAt && new Date(devotion.publishAt) > now) {
    return "scheduled";
  }
  return "live";
}

export function formatScheduleLabel(devotion: Devotion) {
  if (!devotion.publishAt) {
    return devotion.date;
  }
  return new Date(devotion.publishAt).toLocaleString(undefined, {
    timeZone: "America/Denver",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function resolveDevotionPublishFields(input: {
  publishMode?: DevotionPublishMode;
  scheduleDate?: string;
  scheduleTime?: string;
}) {
  const mode = input.publishMode ?? "schedule";
  const scheduleDate = input.scheduleDate || defaultScheduleDateInput();
  const scheduleTime = input.scheduleTime || "06:00";
  const displayDate = formatDisplayDateFromInput(scheduleDate);

  if (mode === "draft") {
    return {
      published: false as const,
      publishAt: null,
      date: displayDate,
    };
  }

  if (mode === "now") {
    const now = new Date();
    return {
      published: true as const,
      publishAt: now.toISOString(),
      date: formatDisplayDateFromInput(toDateInputValue(now)),
    };
  }

  const publishAt = combineScheduleInputs(scheduleDate, scheduleTime);
  return {
    published: true as const,
    publishAt: publishAt.toISOString(),
    date: displayDate,
  };
}

export function devotionToPublishMode(
  devotion: Devotion,
  now = new Date(),
): DevotionPublishMode {
  if (devotion.published === false) {
    return "draft";
  }
  if (devotion.publishAt && new Date(devotion.publishAt) > now) {
    return "schedule";
  }
  return devotion.publishAt ? "schedule" : "now";
}

export function devotionToScheduleInputs(devotion: Devotion) {
  if (devotion.publishAt) {
    return {
      scheduleDate: toDateInputValue(devotion.publishAt),
      scheduleTime: toTimeInputValue(devotion.publishAt),
    };
  }

  const parsed = Date.parse(devotion.date);
  if (!Number.isNaN(parsed)) {
    return {
      scheduleDate: toDateInputValue(new Date(parsed)),
      scheduleTime: "06:00",
    };
  }

  return {
    scheduleDate: defaultScheduleDateInput(),
    scheduleTime: "06:00",
  };
}

export function sortDevotionsForDisplay(a: Devotion, b: Devotion) {
  const aTime = new Date(a.publishAt ?? a.updatedAt ?? a.createdAt ?? a.date).getTime();
  const bTime = new Date(b.publishAt ?? b.updatedAt ?? b.createdAt ?? b.date).getTime();
  return bTime - aTime;
}

export function pickTodayDevotion(devotions: Devotion[], now = new Date()) {
  const visible = devotions.filter((devotion) => isDevotionPubliclyVisible(devotion, now));
  if (visible.length === 0) {
    return null;
  }

  const todayKey = getZonedDateParts(now).dateKey;
  const todays = visible.filter((devotion) => {
    if (devotion.publishAt) {
      return toDateInputValue(devotion.publishAt) === todayKey;
    }
    const parsed = Date.parse(devotion.date);
    if (!Number.isNaN(parsed)) {
      return toDateInputValue(new Date(parsed)) === todayKey;
    }
    return false;
  });

  // Prefer the newest devotion for today; otherwise show the newest live devotion.
  return todays[0] ?? visible[0];
}

export function shouldNotifyDevotionPublish(devotion: Devotion, now = new Date()) {
  if (devotion.notifiedAt) return false;
  return (
    devotion.published !== false &&
    (!devotion.publishAt || new Date(devotion.publishAt) <= now)
  );
}

export function devotionHasAudio(devotion: Devotion) {
  return Boolean(devotion.audioUrl?.trim());
}
