"use client";

import { Capacitor } from "@capacitor/core";

const TOKEN_KEY = "shanah-native-push-token";
const PLATFORM_KEY = "shanah-native-push-platform";
const OPT_OUT_KEY = "shanah-native-push-opt-out";

function storeToken(token: string, platform: "ios" | "android") {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(PLATFORM_KEY, platform);
}

export function isNativePushOptedOut() {
  return typeof window !== "undefined" && window.localStorage.getItem(OPT_OUT_KEY) === "1";
}

export function clearNativePushToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(PLATFORM_KEY);
  window.localStorage.setItem(OPT_OUT_KEY, "1");
}

export async function unregisterNativePush() {
  clearNativePushToken();
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await PushNotifications.unregister();
  } catch {
    // Token is already cleared locally.
  }
}

export async function syncNativePushToken() {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) return false;
  if (isNativePushOptedOut()) return false;
  const token = window.localStorage.getItem(TOKEN_KEY);
  const platform = window.localStorage.getItem(PLATFORM_KEY);
  if (!token || (platform !== "ios" && platform !== "android")) return false;

  const response = await fetch("/api/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "native-subscribe",
      token,
      platform,
    }),
  });
  return response.ok;
}

function openPushUrl(url: string | undefined) {
  if (!url) return;
  window.location.assign(url);
}

export async function registerNativePush() {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) {
    return { ok: false, reason: "not-native" as const };
  }

  window.localStorage.removeItem(OPT_OUT_KEY);
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") {
    return { ok: false, reason: "denied" as const };
  }

  await PushNotifications.register();
  return { ok: true as const };
}

export async function startNativePushListeners() {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) return;

  const { PushNotifications } = await import("@capacitor/push-notifications");
  await PushNotifications.removeAllListeners();

  if (Capacitor.getPlatform() === "android") {
    try {
      await PushNotifications.createChannel({
        id: "default",
        name: "Shanah City",
        description: "Church alerts",
        importance: 5,
        visibility: 1,
        vibration: true,
      });
    } catch {
      // Channel already exists or Android version is too old.
    }
  }

  await PushNotifications.addListener("registration", async ({ value }) => {
    if (isNativePushOptedOut()) return;
    const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
    storeToken(value, platform);
    await syncNativePushToken();
  });

  await PushNotifications.addListener("registrationError", () => {
    // Permission or Firebase/APNs setup failed; web push may still work.
  });

  await PushNotifications.addListener("pushNotificationActionPerformed", (event) => {
    const data = event.notification.data as { url?: string } | undefined;
    openPushUrl(data?.url);
  });
}
