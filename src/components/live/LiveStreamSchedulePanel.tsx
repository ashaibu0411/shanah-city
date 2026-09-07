"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { LiveStreamCountdown } from "@/components/live/LiveStreamCountdown";
import { Button } from "@/components/ui";
import type { LiveStreamSchedule } from "@/lib/live-schedule-types";
import {
  filterUpcomingLiveStreamSchedules,
  formatLiveStreamStartLabel,
  localDateTimeInputToIso,
  sortLiveStreamSchedules,
} from "@/lib/live-schedule-utils";

function toLocalInputValue(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

const SERVICE_PRESETS = [
  { label: "Friday service", title: "Friday Worship" },
  { label: "Sunday service", title: "Sunday Worship" },
] as const;

export function LiveStreamSchedulePanel({ compact = false }: { compact?: boolean }) {
  const { user, loading, permissions } = useAuth();
  const [schedules, setSchedules] = useState<LiveStreamSchedule[]>([]);
  const [managedSchedules, setManagedSchedules] = useState<LiveStreamSchedule[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("Shanah City Worship");
  const [startsAt, setStartsAt] = useState("");
  const [platform, setPlatform] = useState("all");
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [notifyBody, setNotifyBody] = useState("Tap to watch the livestream in the app.");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canManage = !loading && user && permissions.canUploadGallery;

  const upcomingSchedules = useMemo(
    () => filterUpcomingLiveStreamSchedules(schedules),
    [schedules],
  );
  const nextSchedule = upcomingSchedules[0] ?? null;
  const expiredSchedules = useMemo(
    () =>
      sortLiveStreamSchedules(managedSchedules).filter(
        (item) => !upcomingSchedules.some((upcoming) => upcoming.id === item.id),
      ),
    [managedSchedules, upcomingSchedules],
  );

  function resetForm(next?: LiveStreamSchedule | null) {
    setEditingId(next?.id ?? null);
    setTitle(next?.title ?? "Shanah City Worship");
    setStartsAt(toLocalInputValue(next?.startsAt));
    setPlatform(next?.platform ?? "all");
    setNotifyEnabled(next?.notifyEnabled ?? true);
    setNotifyBody(next?.notifyBody ?? "Tap to watch the livestream in the app.");
  }

  async function loadSchedule() {
    const response = await fetch("/api/live/schedule");
    const data = await response.json();
    if (!response.ok) return;
    const upcoming = (data.schedules ?? []) as LiveStreamSchedule[];
    const managed = (data.managedSchedules ?? upcoming) as LiveStreamSchedule[];
    setSchedules(upcoming);
    setManagedSchedules(managed);
    if (editingId && !managed.some((item) => item.id === editingId)) {
      resetForm(null);
    }
  }

  useEffect(() => {
    if (canManage) {
      void loadSchedule();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        id: editingId ?? undefined,
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

    setSchedules((data.schedules ?? []) as LiveStreamSchedule[]);
    setManagedSchedules((data.managedSchedules ?? []) as LiveStreamSchedule[]);
    resetForm(null);
    const savedAt = data.saved?.startsAt
      ? formatLiveStreamStartLabel(data.saved.startsAt)
      : null;
    setMessage(
      savedAt
        ? editingId
          ? `Updated ${savedAt}.`
          : notifyEnabled
            ? `Added ${savedAt} — push notification will send at start time.`
            : `Added ${savedAt} — members will see the next countdown automatically.`
        : editingId
          ? "Schedule updated."
          : "Service added to the schedule.",
    );
  }

  async function clearSchedule(id: string) {
    const target = managedSchedules.find((item) => item.id === id);
    const label = target ? formatLiveStreamStartLabel(target.startsAt) : "this service";
    if (!window.confirm(`Remove the scheduled livestream for ${label}?`)) return;
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/live/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear", id }),
    });
    setBusy(false);
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Could not remove schedule.");
      return;
    }
    setSchedules((data.schedules ?? []) as LiveStreamSchedule[]);
    setManagedSchedules((data.managedSchedules ?? []) as LiveStreamSchedule[]);
    if (editingId === id) resetForm(null);
    setMessage("Scheduled service removed.");
  }

  return (
    <div className={`rounded-2xl border border-violet-200 bg-violet-50/70 ${compact ? "p-3.5" : "p-4"}`}>
      <p className="text-sm font-semibold text-night-900">Schedule live services</p>
      <p className="mt-1 text-xs text-night-600">
        Add Friday and Sunday (or any services) ahead of time. Members always see a countdown to
        the next upcoming stream only.
      </p>

      {expiredSchedules.length > 0 ? (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-200">
          {expiredSchedules.length} saved time
          {expiredSchedules.length === 1 ? " has" : "s have"} already passed. Edit or remove them,
          then add new start times.
        </p>
      ) : null}

      {upcomingSchedules.length > 0 ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-900">
            Upcoming ({upcomingSchedules.length})
          </p>
          {upcomingSchedules.map((item, index) => (
            <div
              key={item.id}
              className="rounded-xl border border-violet-200/80 bg-white/80 p-3 ring-1 ring-white/60"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-night-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-night-600">
                    {formatLiveStreamStartLabel(item.startsAt)}
                    {index === 0 ? " · Countdown active" : " · Queued next"}
                  </p>
                  {item.notifyEnabled ? (
                    <p className="mt-1 text-[11px] text-violet-800">
                      {item.notifySentAt
                        ? "Live push notification was sent."
                        : "Push notification scheduled."}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => resetForm(item)} disabled={busy}>
                    Edit
                  </Button>
                  <Button variant="secondary" onClick={() => void clearSchedule(item.id)} disabled={busy}>
                    Remove
                  </Button>
                </div>
              </div>
              {index === 0 ? (
                <div className="mt-3">
                  <LiveStreamCountdown schedule={item} onComplete={() => void loadSchedule()} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-white/70 px-3 py-2 text-sm text-night-600 ring-1 ring-violet-100">
          No upcoming services scheduled yet.
        </p>
      )}

      <div className="mt-4 rounded-xl border border-violet-200/70 bg-white/75 p-3 ring-1 ring-white/70">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-night-900">
            {editingId ? "Edit service" : "Add service"}
          </p>
          <div className="flex flex-wrap gap-2">
            {SERVICE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setTitle(preset.title)}
                className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-900 ring-1 ring-violet-200/80"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`mt-3 grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
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
            {busy ? "Saving…" : editingId ? "Update service" : "Add to schedule"}
          </Button>
          {editingId ? (
            <Button variant="secondary" onClick={() => resetForm(null)} disabled={busy}>
              Cancel edit
            </Button>
          ) : null}
        </div>
      </div>

      {nextSchedule ? (
        <p className="mt-3 text-xs text-night-600">
          Public countdown: <span className="font-semibold">{nextSchedule.title}</span> on{" "}
          {formatLiveStreamStartLabel(nextSchedule.startsAt)}.
          {upcomingSchedules.length > 1
            ? ` ${upcomingSchedules.length - 1} more service${
                upcomingSchedules.length === 2 ? "" : "s"
              } queued after that.`
            : null}
        </p>
      ) : null}

      {message ? <p className="mt-3 text-sm text-night-700">{message}</p> : null}
    </div>
  );
}
