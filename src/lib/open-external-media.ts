"use client";

import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

/** Opens YouTube (or other URLs) in the system browser / YouTube app for reliable background playback. */
export async function openExternalMediaUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return;

  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url: trimmed, presentationStyle: "fullscreen" });
    return;
  }

  window.open(trimmed, "_blank", "noopener,noreferrer");
}
