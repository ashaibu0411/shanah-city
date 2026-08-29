"use client";

import { Capacitor } from "@capacitor/core";
import { isNativeAppPlatform } from "@/lib/native-app";

type ShanahBridge = {
  setFilePickerOpen?: (open: boolean) => void;
  setBackgroundAudioActive?: (active: boolean) => void;
};

function bridge() {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { ShanahBridge?: ShanahBridge }).ShanahBridge;
}

export function setNativeFilePickerOpen(open: boolean) {
  if (!isNativeAppPlatform()) return;
  try {
    bridge()?.setFilePickerOpen?.(open);
  } catch {
    // Ignore bridge errors on older app builds.
  }
}

export function setNativeBackgroundAudioActive(active: boolean) {
  if (Capacitor.getPlatform() !== "android") return;
  try {
    bridge()?.setBackgroundAudioActive?.(active);
  } catch {
    // Ignore bridge errors on older app builds.
  }
}
