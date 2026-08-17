"use client";

import { Capacitor } from "@capacitor/core";

export function isNativeAppPlatform() {
  return Capacitor.isNativePlatform();
}

export function getNativePlatform() {
  return Capacitor.getPlatform();
}

export async function openExternalUrl(url: string) {
  if (typeof window === "undefined") return;

  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
