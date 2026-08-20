"use client";

import { Capacitor } from "@capacitor/core";

const TOKEN_KEY = "shanah-native-push-token";
const PLATFORM_KEY = "shanah-native-push-platform";
const OPT_OUT_KEY = "shanah-native-push-opt-out";

type NativePushPlatform = "ios" | "android";

function storeToken(token: string, platform: NativePushPlatform) {
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
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) {
    return { ok: false, reason: "not-native" as const };
  }
  if (isNativePushOptedOut()) {
    return { ok: false, reason: "opted-out" as const };
  }

  const token = window.localStorage.getItem(TOKEN_KEY);
  const platform = window.localStorage.getItem(PLATFORM_KEY);
  if (!token || (platform !== "ios" && platform !== "android")) {
    return { ok: false, reason: "no-token" as const };
  }

  const response = await fetch("/api/push", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "native-subscribe",
      token,
      platform,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    return {
      ok: false,
      reason: "server" as const,
      error: typeof data.error === "string" ? data.error : "Could not save push token.",
    };
  }

  return { ok: true as const };
}

function openPushUrl(url: string | undefined) {
  if (!url) return;
  window.location.assign(url);
}

function showForegroundNotification(input: {
  title?: string | null;
  body?: string | null;
  url?: string;
}) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const title = input.title?.trim() || "Shanah City";
  const body = input.body?.trim() || "You have a new update.";
  const url = input.url || "/";

  try {
    const notification = new Notification(title, {
      body,
      icon: "/shanah-city-logo.png",
      badge: "/shanah-city-logo.png",
      data: { url },
    });
    notification.onclick = () => {
      notification.close();
      openPushUrl(url);
    };
  } catch {
    // Some WebViews block Notification even after permission is granted.
  }
}

let listenersReady = false;
let pendingRegistration:
  | {
      resolve: (value: { ok: true } | { ok: false; reason: string }) => void;
      timeoutId: number;
    }
  | null = null;

async function persistRegistration(token: string, platform: NativePushPlatform) {
  if (isNativePushOptedOut()) return { ok: false as const, reason: "opted-out" };
  storeToken(token, platform);
  const sync = await syncNativePushToken();
  if (!sync.ok) {
    return { ok: false as const, reason: sync.reason ?? "server" };
  }
  return { ok: true as const };
}

export async function registerNativePush() {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) {
    return { ok: false, reason: "not-native" as const };
  }

  window.localStorage.removeItem(OPT_OUT_KEY);
  await startNativePushListeners();

  const { PushNotifications } = await import("@capacitor/push-notifications");
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") {
    return { ok: false, reason: "denied" as const };
  }

  const existingToken = window.localStorage.getItem(TOKEN_KEY);
  const existingPlatform = window.localStorage.getItem(PLATFORM_KEY);
  if (
    existingToken &&
    (existingPlatform === "ios" || existingPlatform === "android")
  ) {
    const sync = await syncNativePushToken();
    if (sync.ok) {
      return { ok: true as const };
    }
    // Re-registering usually will not fire another registration event when a token
    // is already cached locally — retry the server sync instead of waiting 15s.
    return {
      ok: false as const,
      reason: sync.reason ?? "server",
      error: "error" in sync ? sync.error : undefined,
    };
  }

  return new Promise<{ ok: true } | { ok: false; reason: string }>((resolve) => {
    if (pendingRegistration) {
      window.clearTimeout(pendingRegistration.timeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      pendingRegistration = null;
      resolve({ ok: false, reason: "timeout" });
    }, 15000);

    pendingRegistration = { resolve, timeoutId };
    void PushNotifications.register();
  });
}

export async function startNativePushListeners() {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform() || listenersReady) {
    return;
  }

  listenersReady = true;
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
    const platform: NativePushPlatform =
      Capacitor.getPlatform() === "ios" ? "ios" : "android";
    const result = await persistRegistration(value, platform);

    if (pendingRegistration) {
      window.clearTimeout(pendingRegistration.timeoutId);
      pendingRegistration.resolve(
        result.ok ? { ok: true } : { ok: false, reason: result.reason },
      );
      pendingRegistration = null;
    }
  });

  await PushNotifications.addListener("registrationError", () => {
    if (pendingRegistration) {
      window.clearTimeout(pendingRegistration.timeoutId);
      pendingRegistration.resolve({ ok: false, reason: "registration-error" });
      pendingRegistration = null;
    }
  });

  await PushNotifications.addListener("pushNotificationReceived", (notification) => {
    const data = notification.data as { url?: string } | undefined;
    showForegroundNotification({
      title: notification.title,
      body: notification.body,
      url: data?.url,
    });
  });

  await PushNotifications.addListener("pushNotificationActionPerformed", (event) => {
    const data = event.notification.data as { url?: string } | undefined;
    openPushUrl(data?.url);
  });
}

export async function ensureNativePushRegistered() {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform() || isNativePushOptedOut()) {
    return { ok: false as const, reason: "not-native" as const };
  }

  await startNativePushListeners();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const sync = await syncNativePushToken();
    if (sync.ok) {
      return { ok: true as const };
    }
    if (sync.reason === "no-token") {
      break;
    }
    if (attempt < 2) {
      await new Promise((resolve) => window.setTimeout(resolve, 750));
    }
  }

  const result = await registerNativePush();
  if (result.ok) {
    return { ok: true as const };
  }

  const retry = await syncNativePushToken();
  if (retry.ok) {
    return { ok: true as const };
  }

  return result;
}

let resumeListenerReady = false;

export async function watchNativePushResync(onSynced?: () => void) {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform() || resumeListenerReady) {
    return;
  }

  resumeListenerReady = true;
  const { App } = await import("@capacitor/app");

  const resync = async () => {
    if (isNativePushOptedOut()) return;
    const result = await ensureNativePushRegistered();
    if (result.ok) {
      onSynced?.();
    }
  };

  await App.addListener("appStateChange", ({ isActive }) => {
    if (isActive) {
      void resync();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void resync();
    }
  });
}
