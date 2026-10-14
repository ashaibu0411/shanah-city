const STORAGE_PREFIX = "shanah-media-progress:";

export function mediaProgressStorageKey(resumeKey: string) {
  return `${STORAGE_PREFIX}${resumeKey}`;
}

export function loadMediaProgress(resumeKey: string): number {
  if (typeof window === "undefined" || !resumeKey) return 0;
  try {
    const raw = localStorage.getItem(mediaProgressStorageKey(resumeKey));
    const seconds = raw ? Number(raw) : 0;
    return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  } catch {
    return 0;
  }
}

export function saveMediaProgress(resumeKey: string, seconds: number) {
  if (typeof window === "undefined" || !resumeKey) return;
  if (!Number.isFinite(seconds) || seconds < 1) return;
  try {
    localStorage.setItem(mediaProgressStorageKey(resumeKey), String(Math.floor(seconds)));
  } catch {
    // ignore quota
  }
}

export function clearMediaProgress(resumeKey: string) {
  if (typeof window === "undefined" || !resumeKey) return;
  try {
    localStorage.removeItem(mediaProgressStorageKey(resumeKey));
  } catch {
    // ignore
  }
}
