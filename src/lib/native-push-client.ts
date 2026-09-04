"use client";

import { Capacitor } from "@capacitor/core";
import { getPushBadgeUrl, getPushIconUrl } from "@/lib/push-branding";

const TOKEN_KEY = "shanah-native-push-token";
const PLATFORM_KEY = "shanah-native-push-platform";
const OPT_OUT_KEY = "shanah-native-push-opt-out";

type NativePushPlatform = "ios" | "android";

function isPluginNotImplementedError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /not implemented on android|plugin is not implemented/i.test(message);
}

export function nativePushUnavailableMessage() {
  return "This Android app build is too old for phone push. Update Shana City from the Play Store (version 1.0.6+), then try Enable again.";
}

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
  // Do not call PushNotifications.unregister() here — on Android it often prevents
  // the registration event from firing again until the app is fully restarted.
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

  const title = input.title?.trim() || "Shana City";
  const body = input.body?.trim() || "You have a new update.";
  const url = input.url || "/";

  try {
    const notification = new Notification(title, {
      body,
      icon: getPushIconUrl(),
      badge: getPushBadgeUrl(),
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
      resolve: (value: { ok: true } | { ok: false; reason: string; error?: string }) => void;
      timeoutId: number;
    }
  | null = null;

async function resetNativePushListeners() {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) {
    return;
  }
  if (pendingRegistration) {
    window.clearTimeout(pendingRegistration.timeoutId);
    pendingRegistration = null;
  }
  listenersReady = false;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await PushNotifications.removeAllListeners();
  } catch {
    // Listener cleanup is best-effort.
  }
}

async function persistRegistration(token: string, platform: NativePushPlatform) {
  if (isNativePushOptedOut()) return { ok: false as const, reason: "opted-out" };
  storeToken(token, platform);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const sync = await syncNativePushToken();
    if (sync.ok) {
      window.dispatchEvent(new Event("shanah-push-synced"));
      return { ok: true as const };
    }
    if (sync.reason === "opted-out" || sync.reason === "not-native") {
      return { ok: false as const, reason: sync.reason };
    }
    if (attempt < 3) {
      await new Promise((resolve) => window.setTimeout(resolve, 500 * (attempt + 1)));
    }
  }

  return { ok: false as const, reason: "server" };
}

export async function registerNativePush() {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) {
    return { ok: false, reason: "not-native" as const };
  }

  window.localStorage.removeItem(OPT_OUT_KEY);
  await resetNativePushListeners();
  await startNativePushListeners();

  const { PushNotifications } = await import("@capacitor/push-notifications");

  let permission;
  try {
    permission = await PushNotifications.checkPermissions();
    if (permission.receive === "prompt" || permission.receive === "prompt-with-rationale") {
      permission = await PushNotifications.requestPermissions();
    }
  } catch (error) {
    if (isPluginNotImplementedError(error)) {
      return { ok: false, reason: "plugin-missing" as const };
    }
    throw error;
  }
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
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(PLATFORM_KEY);
  }

  return new Promise<{ ok: true } | { ok: false; reason: string; error?: string }>((resolve) => {
    if (pendingRegistration) {
      window.clearTimeout(pendingRegistration.timeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      pendingRegistration = null;
      resolve({ ok: false, reason: "timeout" });
    }, 20000);

    pendingRegistration = { resolve, timeoutId };

    void PushNotifications.register().catch((error: unknown) => {
      if (!pendingRegistration) return;
      window.clearTimeout(pendingRegistration.timeoutId);
      pendingRegistration = null;
      if (isPluginNotImplementedError(error)) {
        resolve({ ok: false, reason: "plugin-missing" });
        return;
      }
      resolve({
        ok: false,
        reason: "registration-error",
        error: error instanceof Error ? error.message : "Registration failed.",
      });
    });
  });
}

async function refreshNativeRegistration() {
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const permission = await PushNotifications.checkPermissions();
  if (permission.receive !== "granted") {
    return { ok: false as const, reason: "denied" as const };
  }
  await PushNotifications.register();
  return { ok: true as const };
}

export async function startNativePushListeners() {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform() || listenersReady) {
    return;
  }

  listenersReady = true;
  let PushNotifications;
  try {
    ({ PushNotifications } = await import("@capacitor/push-notifications"));
    await PushNotifications.removeAllListeners();
  } catch (error) {
    listenersReady = false;
    if (isPluginNotImplementedError(error)) {
      return;
    }
    throw error;
  }

  if (Capacitor.getPlatform() === "android") {
    try {
      await PushNotifications.createChannel({
        id: "default",
        name: "Shana City",
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

  await PushNotifications.addListener("registrationError", (error) => {
    console.error("Native push registration failed:", error);
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

  const permission = await import("@capacitor/push-notifications").then((mod) =>
    mod.PushNotifications.checkPermissions(),
  );
  if (permission.receive === "granted") {
    await refreshNativeRegistration();
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const sync = await syncNativePushToken();
      if (sync.ok) {
        return { ok: true as const };
      }
      if (sync.reason === "no-token" && attempt < 3) {
        await new Promise((resolve) => window.setTimeout(resolve, 750));
        continue;
      }
      break;
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
