/** Disappearing message timer presets (seconds). 0 = off. */

export const CHAT_DISAPPEARING_OPTIONS = [
  { value: 0, label: "Off" },
  { value: 86_400, label: "24 hours" },
  { value: 604_800, label: "7 days" },
  { value: 2_592_000, label: "30 days" },
  { value: 7_776_000, label: "90 days" },
] as const;

export type ChatDisappearingSeconds =
  (typeof CHAT_DISAPPEARING_OPTIONS)[number]["value"];

export function normalizeDisappearingSeconds(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return CHAT_DISAPPEARING_OPTIONS.some((o) => o.value === n) ? n : 0;
}

export function disappearingTimerLabel(seconds: number): string {
  const match = CHAT_DISAPPEARING_OPTIONS.find((o) => o.value === seconds);
  return match?.label ?? "Off";
}

export function disappearingBannerText(seconds: number): string | null {
  if (seconds <= 0) return null;
  return `New messages disappear after ${disappearingTimerLabel(seconds).toLowerCase()}.`;
}

export function messageExpiresAt(
  createdAt: string,
  disappearingSeconds: number,
): string | undefined {
  if (disappearingSeconds <= 0) return undefined;
  const base = Date.parse(createdAt);
  if (!Number.isFinite(base)) return undefined;
  return new Date(base + disappearingSeconds * 1000).toISOString();
}

export function isMessageExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  return Number.isFinite(t) && t <= Date.now();
}
