"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { LiveStreamPublicShare } from "@/components/live/LiveStreamPublicShare";
import { Button } from "@/components/ui";
import { liveStream } from "@/lib/site";

type LiveStreamNotifyPanelProps = {
  platform?: string;
  compact?: boolean;
  isLive?: boolean;
  streamTitle?: string;
};

export function LiveStreamNotifyPanel({
  platform,
  compact = false,
  isLive = false,
  streamTitle,
}: LiveStreamNotifyPanelProps) {
  const { user, loading, permissions } = useAuth();
  const [title, setTitle] = useState(streamTitle ?? liveStream.title ?? "Shanah City is live");
  const [body, setBody] = useState("Tap to watch the livestream in the app.");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canManage = !loading && user && permissions.canUploadGallery;

  if (!canManage) {
    return (
      <LiveStreamPublicShare
        title={streamTitle ?? liveStream.title}
        platform={platform}
        isLive={isLive}
        compact={compact}
      />
    );
  }

  async function sendLiveNotification() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/live/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not send notification.");
      return;
    }

    setMessage(
      data.sent > 0
        ? `Live alert sent to ${data.sent} device${data.sent === 1 ? "" : "s"}.`
        : "No devices received the alert (members may need to enable push in Profile).",
    );
  }

  return (
    <div
      className={`rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-orange-50/80 ${
        compact ? "p-3.5" : "p-4"
      }`}
    >
      <p className="text-sm font-semibold text-night-900">Go live — notify everyone</p>
      <p className="mt-1 text-xs text-night-600">
        Media team only. Sends a push to members with church announcements enabled in Profile.
      </p>

      <div className={`mt-4 grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-night-800">Notification title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-night-800">Short message</span>
          <input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={sendLiveNotification} disabled={busy || !title.trim()}>
          {busy ? "Sending…" : "Send live notification"}
        </Button>
      </div>

      {message ? <p className="mt-3 text-sm text-night-700">{message}</p> : null}

      <div className="mt-4 border-t border-red-200/80 pt-4">
        <LiveStreamPublicShare
          title={title}
          platform={platform}
          isLive={isLive}
          compact
        />
      </div>
    </div>
  );
}
