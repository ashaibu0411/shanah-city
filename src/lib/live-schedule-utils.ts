import type { LiveStreamSchedule } from "@/lib/live-schedule-types";

/** How long a scheduled service stays in the "live" phase after start time. */
export const DEFAULT_LIVE_STREAM_WINDOW_MS = 3 * 60 * 60 * 1000;

export type LiveStreamPhase = "live" | "upcoming";

export type PublicLiveStreamDisplay = {
  schedule: LiveStreamSchedule | null;
  livePhase: LiveStreamPhase | null;
};

export type LiveStreamCountdownParts = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

export function getLiveStreamWindowEndMs(
  startsAt: string,
  windowMs = DEFAULT_LIVE_STREAM_WINDOW_MS,
) {
  const startMs = Date.parse(startsAt);
  if (!Number.isFinite(startMs)) return Number.NaN;
  return startMs + windowMs;
}

export function isLiveStreamScheduleActive(
  schedule: LiveStreamSchedule,
  nowMs = Date.now(),
  windowMs = DEFAULT_LIVE_STREAM_WINDOW_MS,
) {
  const startMs = Date.parse(schedule.startsAt);
  if (!Number.isFinite(startMs)) return false;
  return nowMs >= startMs && nowMs < getLiveStreamWindowEndMs(schedule.startsAt, windowMs);
}

export function resolvePublicLiveStreamDisplay(
  schedules: LiveStreamSchedule[],
  now: Date = new Date(),
  windowMs = DEFAULT_LIVE_STREAM_WINDOW_MS,
): PublicLiveStreamDisplay {
  const sorted = sortLiveStreamSchedules(schedules);
  const nowMs = now.getTime();

  const active = sorted.find((schedule) => isLiveStreamScheduleActive(schedule, nowMs, windowMs));
  if (active) {
    return { schedule: active, livePhase: "live" };
  }

  const upcoming = filterUpcomingLiveStreamSchedules(sorted, now)[0] ?? null;
  if (upcoming) {
    return { schedule: upcoming, livePhase: "upcoming" };
  }

  return { schedule: null, livePhase: null };
}

export function filterUpcomingLiveStreamSchedules(
  schedules: LiveStreamSchedule[],
  now: Date = new Date(),
) {
  return sortLiveStreamSchedules(schedules).filter(
    (schedule) => new Date(schedule.startsAt) > now,
  );
}

export function sortLiveStreamSchedules(schedules: LiveStreamSchedule[]) {
  return [...schedules].sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );
}

export function getLiveStreamCountdown(startsAt: string, now = Date.now()): LiveStreamCountdownParts {
  const target = Date.parse(startsAt);
  const totalMs = target - now;

  if (!Number.isFinite(target) || totalMs <= 0) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }

  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return { totalMs, days, hours, minutes, seconds, done: false };
}

export function formatLiveStreamCountdown(parts: LiveStreamCountdownParts) {
  if (parts.done) return null;
  if (parts.days > 0) {
    return `${parts.days}d ${parts.hours}h ${parts.minutes}m`;
  }
  if (parts.hours > 0) {
    return `${parts.hours}h ${String(parts.minutes).padStart(2, "0")}m ${String(parts.seconds).padStart(2, "0")}s`;
  }
  return `${parts.minutes}m ${String(parts.seconds).padStart(2, "0")}s`;
}

export function formatLiveStreamStartLabel(startsAt: string) {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function liveStreamPlatformLabel(platform?: LiveStreamSchedule["platform"]) {
  if (platform === "youtube") return "YouTube";
  if (platform === "facebook-city") return "Facebook · Shanah City";
  if (platform === "facebook-revival") return "Facebook · Shanah Revival";
  return "YouTube & Facebook";
}

/** Convert a datetime-local value from the browser into UTC ISO for the server. */
export function localDateTimeInputToIso(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}
