export type LoveNotesTab = "notes" | "shared";

export const LOVE_NOTE_CARD_BACKGROUNDS = [
  "var(--couples-blush)",
  "#FBF4E8",
  "var(--couples-blue)",
  "var(--couples-sage)",
  "var(--couples-lavender)",
] as const;

export const LOVE_NOTE_EMPTY_EXAMPLES = [
  "I'm so grateful for you…",
  "You make our home feel like home.",
  "Just a reminder: I love you!",
] as const;

const NOTIFY_PREF_KEY = "couples-love-notes-notify-hint-dismissed";

export function loveNotesNotifyHintDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(NOTIFY_PREF_KEY) === "1";
}

export function dismissLoveNotesNotifyHint() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTIFY_PREF_KEY, "1");
}
