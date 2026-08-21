"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card } from "@/components/ui";
import type { NotificationPrefs } from "@/lib/auth-types";
import { isNativeAppPlatform } from "@/lib/native-app";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationSettings() {
  const { user, loading, setUser } = useAuth();
  const [configured, setConfigured] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [deviceCounts, setDeviceCounts] = useState({ web: 0, native: 0, platforms: [] as string[] });
  const [serverPush, setServerPush] = useState({ web: false, android: false, ios: false });
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    pushEnabled: true,
    devotions: true,
    messages: true,
    announcements: true,
    worship: true,
    kids: true,
  });
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setPrefs(
      user.notificationPrefs ?? {
        pushEnabled: true,
        devotions: true,
        messages: true,
        announcements: true,
        worship: true,
        kids: true,
      },
    );

    void refreshPushStatus();
  }, [user]);

  async function refreshPushStatus() {
    try {
      const response = await fetch("/api/push", { credentials: "include" });
      const data = await response.json();
      setConfigured(Boolean(data.configured));
      setPublicKey(data.publicKey ?? "");
      setDeviceCounts(
        data.devices ?? { web: 0, native: 0, platforms: [] as string[] },
      );
      setServerPush(data.server ?? { web: false, android: false, ios: false });
      const nativeReady = isNativeAppPlatform()
        ? (data.devices?.native ?? 0) > 0
        : Boolean(data.subscribed);
      setEnabled(nativeReady);
    } catch {
      // Ignore transient fetch errors.
    }
  }

  useEffect(() => {
    if (!user) return;
    const onFocus = () => {
      void refreshPushStatus();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("shanah-push-synced", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("shanah-push-synced", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [user]);

  async function savePreferences(nextPrefs: NotificationPrefs) {
    setPrefs(nextPrefs);
    await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "preferences", ...nextPrefs }),
    });
  }

  async function enablePush() {
    if (!user) return;
    setBusy(true);
    setStatus(null);

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      if (!isNativeAppPlatform()) {
        setStatus("Push notifications are not supported on this browser.");
        setBusy(false);
        return;
      }
    }

    if (isNativeAppPlatform()) {
      try {
        const { registerNativePush } = await import("@/lib/native-push-client");
        const result = await registerNativePush();
        await refreshPushStatus();
        setBusy(false);
        if (!result.ok) {
          setStatus(
            result.reason === "denied"
              ? "Notification permission was denied."
              : "error" in result && result.error
                ? result.error
                : "Could not register this phone for push. Open Profile again after signing in.",
          );
          return;
        }
        setEnabled(true);
        setStatus("Push notifications enabled on this phone.");
      } catch {
        setBusy(false);
        setStatus("Could not enable push notifications on this phone.");
      }
      return;
    }

    if (!configured || !publicKey) {
      setStatus("Push is not configured on the server yet. Add VAPID keys to .env.local.");
      setBusy(false);
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("Notification permission was denied.");
      setBusy(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const response = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "subscribe",
          subscription: subscription.toJSON(),
        }),
      });
      const data = await response.json();
      setBusy(false);

      if (!response.ok) {
        setStatus(data.error ?? "Could not enable push notifications.");
        return;
      }

      setEnabled(true);
      setDeviceCounts((current) => ({
        ...current,
        web: Math.max(current.web, 1),
      }));
      if (data.user) setUser(data.user);
      setStatus("Push notifications enabled on this device.");
    } catch {
      setBusy(false);
      setStatus("Could not register for push notifications on this device.");
    }
  }

  async function sendTestPush() {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch("/api/push", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const data = await response.json();
      setBusy(false);
      if (!response.ok || !data.ok) {
        const detail = Array.isArray(data.errors) ? data.errors.join(" · ") : "";
        setStatus(
          detail || data.error || "Test push could not be delivered. Enable push on this phone first.",
        );
        return;
      }
      setStatus("Test alert sent. Check your phone notification tray.");
    } catch {
      setBusy(false);
      setStatus("Could not send a test push right now.");
    }
  }

  async function disablePush() {
    setBusy(true);
    setStatus(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
    } catch {
      // Continue removing server-side subscription.
    }

    try {
      const { unregisterNativePush } = await import("@/lib/native-push-client");
      await unregisterNativePush();
    } catch {
      // Browser path has no native token to clear.
    }

    const response = await fetch("/api/push", { method: "DELETE" });
    const data = await response.json();
    setBusy(false);
    setEnabled(false);
    if (data.user) setUser(data.user);
    setStatus("Push notifications turned off for this device.");
  }

  if (loading || !user) {
    return null;
  }

  return (
    <Card>
      <h2 className="font-display text-xl font-semibold text-night-900">
        Push notifications
      </h2>
      <p className="mt-2 text-sm text-night-600">
        Get alerts for community posts, worship plans, devotions, kids ministry updates, and member messages — including the Play Store and TestFlight apps.
      </p>

      <div className="mt-4 space-y-3">
        <label className="flex items-center justify-between rounded-xl bg-sand-50 px-4 py-3 text-sm">
          <span>Community posts &amp; short videos</span>
          <input
            type="checkbox"
            checked={prefs.announcements}
            onChange={(event) => {
              const next = { ...prefs, announcements: event.target.checked };
              savePreferences(next);
            }}
          />
        </label>
        <label className="flex items-center justify-between rounded-xl bg-sand-50 px-4 py-3 text-sm">
          <span>Worship plans &amp; rehearsal reminders</span>
          <input
            type="checkbox"
            checked={prefs.worship}
            onChange={(event) => {
              const next = { ...prefs, worship: event.target.checked };
              savePreferences(next);
            }}
          />
        </label>
        <label className="flex items-center justify-between rounded-xl bg-sand-50 px-4 py-3 text-sm">
          <span>New devotions</span>
          <input
            type="checkbox"
            checked={prefs.devotions}
            onChange={(event) => {
              const next = { ...prefs, devotions: event.target.checked };
              savePreferences(next);
            }}
          />
        </label>
        <label className="flex items-center justify-between rounded-xl bg-sand-50 px-4 py-3 text-sm">
          <span>Kids ministry updates &amp; incidents</span>
          <input
            type="checkbox"
            checked={prefs.kids}
            onChange={(event) => {
              const next = { ...prefs, kids: event.target.checked };
              savePreferences(next);
            }}
          />
        </label>
        <label className="flex items-center justify-between rounded-xl bg-sand-50 px-4 py-3 text-sm">
          <span>New messages</span>
          <input
            type="checkbox"
            checked={prefs.messages}
            onChange={(event) => {
              const next = { ...prefs, messages: event.target.checked };
              savePreferences(next);
            }}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {enabled ? (
          <>
            <Button variant="secondary" onClick={disablePush} disabled={busy}>
              Turn off push
            </Button>
            <Button variant="secondary" onClick={sendTestPush} disabled={busy}>
              {busy ? "Sending..." : "Send test alert"}
            </Button>
          </>
        ) : (
          <Button onClick={enablePush} disabled={busy}>
            {busy ? "Enabling..." : "Enable push notifications"}
          </Button>
        )}
      </div>

      {isNativeAppPlatform() && (
        <p className="mt-3 text-xs text-night-500">
          Phone server: Android {serverPush.android ? "ready" : "missing"} · iOS{" "}
          {serverPush.ios ? "ready" : "missing"}
        </p>
      )}

      {enabled && (
        <p className="mt-3 text-xs text-night-500">
          Registered devices: {deviceCounts.native > 0 ? "phone app" : ""}
          {deviceCounts.native > 0 && deviceCounts.web > 0 ? " · " : ""}
          {deviceCounts.web > 0 ? "browser" : ""}
          {deviceCounts.native === 0 && deviceCounts.web === 0
            ? "still syncing — reopen Profile in a few seconds"
            : ""}
          {isNativeAppPlatform() && enabled && deviceCounts.native === 0 ? (
            <>
              {" "}
              · Phone token not on server yet. Force-close and reopen the app, or tap Enable
              again.
            </>
          ) : null}
        </p>
      )}

      {!enabled && (
        <p className="mt-3 text-xs text-night-500">
          {isNativeAppPlatform()
            ? "Open Profile in the Shanah City app, tap Enable, and allow notifications when your phone asks."
            : "Each phone must enable push on its own account under Profile. Only the message recipient gets an alert, not the sender."}
        </p>
      )}

      {!configured && (
        <p className="mt-3 text-xs text-night-500">
          Server push is not configured yet. Add VAPID keys for the website, plus Firebase and
          APNs keys for the phone apps.
        </p>
      )}

      {status && (
        <p className="mt-3 rounded-xl bg-sand-100 px-3 py-2 text-sm text-night-700">{status}</p>
      )}
    </Card>
  );
}
