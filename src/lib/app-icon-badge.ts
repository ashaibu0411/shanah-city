"use client";

import { Capacitor } from "@capacitor/core";

function clampBadgeCount(count: number) {
  if (!Number.isFinite(count) || count < 0) return 0;
  return Math.min(99, Math.floor(count));
}

export async function syncAppIconBadgeCount(count: number) {
  if (typeof window === "undefined") return;

  const badge = clampBadgeCount(count);
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      const { Badge } = await import("@capawesome/capacitor-badge");
      const supported = await Badge.isSupported();
      if (supported.isSupported) {
        if (badge > 0) {
          await Badge.set({ count: badge });
        } else {
          await Badge.clear();
        }
      }
    } catch {
      // Native badge plugin missing on older builds.
    }
  }

  if ("setAppBadge" in navigator) {
    try {
      if (badge > 0) {
        await (
          navigator as Navigator & { setAppBadge: (value: number) => Promise<void> }
        ).setAppBadge(badge);
      } else if ("clearAppBadge" in navigator) {
        await (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge();
      }
    } catch {
      // Badging API unavailable or denied.
    }
  }
}
