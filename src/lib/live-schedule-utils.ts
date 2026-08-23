import type { LiveStreamSchedule } from "@/lib/live-schedule-types";

export type LiveStreamCountdownParts = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

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
