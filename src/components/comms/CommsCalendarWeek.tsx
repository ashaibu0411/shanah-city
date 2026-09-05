"use client";

import { useEffect, useMemo, useState } from "react";
import { COMMS_CHANNELS } from "@/lib/comms-constants";
import type { CommsCalendarItem, CommsChannelId } from "@/lib/comms-types";
import {
  daysInWeek,
  shiftWeek,
  startOfWeekMonday,
  weekLabel,
  weekStartIso,
} from "@/lib/comms-week-utils";
import { Button, Card } from "@/components/ui";

function toDateInputValue(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function CommsCalendarWeek() {
  const [weekStart, setWeekStart] = useState(weekStartIso());
  const [items, setItems] = useState<CommsCalendarItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<CommsChannelId>("service_announcement");
  const [scheduledDate, setScheduledDate] = useState("");
  const [homeBanner, setHomeBanner] = useState(true);
  const [community, setCommunity] = useState(true);
  const [push, setPush] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const weekStartDate = useMemo(() => startOfWeekMonday(new Date(weekStart)), [weekStart]);
  const weekDays = useMemo(() => daysInWeek(weekStartDate), [weekStartDate]);
  const selected = items.find((item) => item.id === selectedId) ?? null;

  async function load(nextWeekStart = weekStart) {
    const response = await fetch(
      `/api/comms/calendar?weekStart=${encodeURIComponent(nextWeekStart)}`,
    );
    const data = await response.json();
    if (response.ok) {
      setItems(data.items ?? []);
    }
  }

  useEffect(() => {
    void load(weekStart);
  }, [weekStart]);

  useEffect(() => {
    if (!selected) {
      setTitle("");
      setBody("");
      return;
    }
    setTitle(selected.title);
    setBody(selected.body ?? "");
    setChannel(selected.channel);
    setScheduledDate(toDateInputValue(selected.scheduledDate));
  }, [selected]);

  async function createItem() {
    if (!title.trim()) {
      setMessage("Add a title first.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/comms/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body,
        channel,
        weekStart,
        scheduledDate: scheduledDate ? new Date(`${scheduledDate}T09:00:00`).toISOString() : undefined,
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not create calendar item.");
      return;
    }
    setTitle("");
    setBody("");
    setScheduledDate("");
    setMessage("Calendar item added.");
    await load();
  }

  async function saveSelected() {
    if (!selected) return;
    setBusy(true);
    const response = await fetch("/api/comms/calendar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selected.id,
        title,
        body,
        channel,
        scheduledDate: scheduledDate ? new Date(`${scheduledDate}T09:00:00`).toISOString() : undefined,
      }),
    });
    setBusy(false);
    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error ?? "Could not save item.");
      return;
    }
    setMessage("Saved.");
    await load();
  }

  async function promoteSelected() {
    if (!selected) return;
    if (!homeBanner && !community && !push) {
      setMessage("Choose at least one destination.");
      return;
    }
    setBusy(true);
    if (title !== selected.title || body !== (selected.body ?? "")) {
      await saveSelected();
    }
    const response = await fetch(`/api/comms/calendar/${selected.id}/promote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeBanner, community, push }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not promote item.");
      return;
    }
    setMessage("Promoted to the app.");
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-night-500">Week of</p>
          <h3 className="text-xl font-bold text-night-900">{weekLabel(weekStartDate)}</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setWeekStart(shiftWeek(weekStart, -1))}>
            Previous
          </Button>
          <Button variant="secondary" onClick={() => setWeekStart(weekStartIso())}>
            This week
          </Button>
          <Button variant="secondary" onClick={() => setWeekStart(shiftWeek(weekStart, 1))}>
            Next
          </Button>
        </div>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-night-900/10 bg-sand-50">
              <th className="px-4 py-3 text-left font-semibold text-night-700">Channel</th>
              {weekDays.map((day) => (
                <th key={day.toISOString()} className="px-3 py-3 text-left font-semibold text-night-700">
                  {day.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMMS_CHANNELS.map((entry) => (
              <tr key={entry.id} className="border-b border-night-900/5 align-top">
                <td className="px-4 py-3 font-semibold text-night-900">{entry.label}</td>
                {weekDays.map((day) => {
                  const dayIso = day.toISOString().slice(0, 10);
                  const dayItems = items.filter((item) => {
                    if (item.channel !== entry.id) return false;
                    if (!item.scheduledDate) return false;
                    return item.scheduledDate.slice(0, 10) === dayIso;
                  });
                  return (
                    <td key={`${entry.id}-${dayIso}`} className="px-2 py-3">
                      <div className="space-y-2">
                        {dayItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedId(item.id)}
                            className={`block w-full rounded-xl px-2 py-2 text-left text-xs font-semibold text-white ${
                              selectedId === item.id ? "ring-2 ring-night-900" : ""
                            }`}
                            style={{ backgroundColor: item.color ?? entry.color }}
                          >
                            {item.title}
                          </button>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="space-y-4">
        <h3 className="text-lg font-bold text-night-900">
          {selected ? "Edit calendar item" : "Add calendar item"}
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="rounded-xl border border-night-900/10 px-3 py-2"
          />
          <select
            value={channel}
            onChange={(event) => setChannel(event.target.value as CommsChannelId)}
            className="rounded-xl border border-night-900/10 px-3 py-2"
          >
            {COMMS_CHANNELS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          placeholder="Message copy for this channel"
          className="w-full rounded-xl border border-night-900/10 px-3 py-2"
        />
        <input
          type="date"
          value={scheduledDate}
          onChange={(event) => setScheduledDate(event.target.value)}
          className="rounded-xl border border-night-900/10 px-3 py-2"
        />

        {selected ? (
          <div className="space-y-3 rounded-2xl bg-sand-50 p-4">
            <p className="text-sm font-semibold text-night-900">Promote to app</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={homeBanner} onChange={(e) => setHomeBanner(e.target.checked)} />
              Home banner (urgent alert)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={community} onChange={(e) => setCommunity(e.target.checked)} />
              Community announcement
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} />
              Push notification
            </label>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void saveSelected()} disabled={busy} variant="secondary">
                Save
              </Button>
              <Button onClick={() => void promoteSelected()} disabled={busy}>
                Promote
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => void createItem()} disabled={busy}>
            Add to calendar
          </Button>
        )}

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      </Card>
    </div>
  );
}
