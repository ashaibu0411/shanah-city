"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card } from "@/components/ui";
import type { NotificationPrefs } from "@/lib/auth-types";

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
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    pushEnabled: true,
    devotions: true,
    messages: true,
    announcements: true,
    worship: true,
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
      },
    );

    fetch("/api/push")
      .then((response) => response.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
        setPublicKey(data.publicKey ?? "");
        setEnabled(Boolean(data.subscribed));
      })
      .catch(() => undefined);
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
      setStatus("Push notifications are not supported on this browser.");
      setBusy(false);
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
      if (data.user) setUser(data.user);
      setStatus("Push notifications enabled on this device.");
    } catch {
      setBusy(false);
      setStatus("Could not register for push notifications on this device.");
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
        Get alerts for community posts, worship plans, devotions, and member messages.
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
          <Button variant="secondary" onClick={disablePush} disabled={busy}>
            Turn off push
          </Button>
        ) : (
          <Button onClick={enablePush} disabled={busy}>
            {busy ? "Enabling..." : "Enable push notifications"}
          </Button>
        )}
      </div>

      {!configured && (
        <p className="mt-3 text-xs text-night-500">
          Server push keys are not set yet. Add VAPID keys to `.env.local` and restart the dev
          server.
        </p>
      )}

      {status && (
        <p className="mt-3 rounded-xl bg-sand-100 px-3 py-2 text-sm text-night-700">{status}</p>
      )}
    </Card>
  );
}
