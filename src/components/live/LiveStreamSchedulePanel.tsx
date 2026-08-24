"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { LiveStreamCountdown } from "@/components/live/LiveStreamCountdown";
import { Button } from "@/components/ui";
import type { LiveStreamSchedule } from "@/lib/live-schedule-types";
import {
  formatLiveStreamStartLabel,
  localDateTimeInputToIso,
} from "@/lib/live-schedule-utils";

function toLocalInputValue(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function LiveStreamSchedulePanel({ compact = false }: { compact?: boolean }) {
  const { user, loading, permissions } = useAuth();
  const [schedule, setSchedule] = useState<LiveStreamSchedule | null>(null);
  const [expiredSchedule, setExpiredSchedule] = useState(false);
  const [title, setTitle] = useState("Shanah City Worship");
  const [startsAt, setStartsAt] = useState("");
  const [platform, setPlatform] = useState("all");
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [notifyBody, setNotifyBody] = useState("Tap to watch the livestream in the app.");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canManage = !loading && user && permissions.canUploadGallery;

  async function loadSchedule() {
    const response = await fetch("/api/live/schedule");
    const data = await response.json();
    if (!response.ok) return;
    const current = (data.schedule ?? null) as LiveStreamSchedule | null;
    const managed = (data.managedSchedule ?? null) as LiveStreamSchedule | null;
    const source = current ?? managed;
    setSchedule(current);
    setExpiredSchedule(Boolean(managed && !current));
    if (source) {
      setTitle(source.title);
      setStartsAt(toLocalInputValue(source.startsAt));
      setPlatform(source.platform ?? "all");
      setNotifyEnabled(source.notifyEnabled ?? false);
      setNotifyBody(source.notifyBody ?? "Tap to watch the livestream in the app.");
    }
  }

  useEffect(() => {
    if (canManage) {
      void loadSchedule();
    }
  }, [canManage]);

  if (!canManage) {
    return null;
  }

  async function saveSchedule() {
    setBusy(true);
    setMessage(null);
    const startsAtIso = localDateTimeInputToIso(startsAt);
    if (!startsAtIso) {
      setBusy(false);
      setMessage("Choose a valid date and time.");
      return;
    }
    const response = await fetch("/api/live/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        title,
        startsAt: startsAtIso,
        platform,
        notifyEnabled,
        notifyBody,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not save schedule.");
      return;
    }

    setSchedule(data.schedule ?? null);
    setExpiredSchedule(false);
    const savedAt = data.schedule?.startsAt
      ? formatLiveStreamStartLabel(data.schedule.startsAt)
      : null;
    setMessage(
      savedAt
        ? notifyEnabled
          ? `Countdown is live — push notification scheduled for ${savedAt}.`
          : `Countdown is live for everyone — starts ${savedAt} on your phone’s clock.`
        : notifyEnabled
          ? "Countdown is live — push notification will send at start time."
          : "Countdown is live for everyone in the app.",
    );
  }

  async function clearSchedule() {
    if (!window.confirm("Remove the upcoming livestream countdown?")) return;
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/live/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear" }),
    });
    setBusy(false);
    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error ?? "Could not clear schedule.");
      return;
    }
    setSchedule(null);
    setExpiredSchedule(false);
    setStartsAt("");
    setMessage("Countdown removed.");
  }

  return (
    <div className={`rounded-2xl border border-violet-200 bg-violet-50/70 ${compact ? "p-3.5" : "p-4"}`}>
      <p className="text-sm font-semibold text-night-900">Schedule next livestream</p>
      <p className="mt-1 text-xs text-night-600">
        Media team only. Members see a countdown on Home and Media → Live. Optionally send a push
        automatically when the stream starts.
      </p>

      {expiredSchedule ? (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-200">
          The saved time has already passed (often a timezone mix-up). Pick a new start time and tap
          Update countdown.
        </p>
      ) : null}

      {schedule ? (
        <div className="mt-4">
          <LiveStreamCountdown schedule={schedule} onComplete={() => setSchedule(null)} />
          {schedule.notifyEnabled ? (
            <p className="mt-2 text-xs text-violet-800">
              {schedule.notifySentAt
                ? "Live push notification was sent."
                : `Push notification scheduled for ${formatLiveStreamStartLabel(schedule.startsAt)}.`}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={`mt-4 grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
        <label className="block">
          <span className="text-sm font-semibold text-night-800">Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-night-800">Start date &amp; time</span>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
            className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-night-800">Primary platform</span>
          <select
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
            className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          >
            <option value="all">YouTube &amp; Facebook</option>
            <option value="youtube">YouTube</option>
            <option value="facebook-city">Facebook · Shanah City</option>
            <option value="facebook-revival">Facebook · Shanah Revival</option>
          </select>
        </label>
        <label className="flex items-start gap-3 md:col-span-2">
          <input
            type="checkbox"
            checked={notifyEnabled}
            onChange={(event) => setNotifyEnabled(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-night-900/20"
          />
          <span>
            <span className="text-sm font-semibold text-night-800">
              Send push notification when we go live
            </span>
            <span className="mt-1 block text-xs text-night-600">
              Uses the start date &amp; time above. Members need church announcements enabled in
              Profile.
            </span>
          </span>
        </label>
        {notifyEnabled ? (
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-night-800">Notification message</span>
            <input
              value={notifyBody}
              onChange={(event) => setNotifyBody(event.target.value)}
              placeholder="Tap to watch the livestream in the app."
              className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </label>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={saveSchedule} disabled={busy || !startsAt.trim()}>
          {busy ? "Saving…" : schedule ? "Update countdown" : "Start countdown"}
        </Button>
        {schedule ? (
          <Button variant="secondary" onClick={clearSchedule} disabled={busy}>
            Remove
          </Button>
        ) : null}
      </div>

      {message ? <p className="mt-3 text-sm text-night-700">{message}</p> : null}
    </div>
  );
}
