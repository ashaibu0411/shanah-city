"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  eventRsvpFormToPayload,
  EventRsvpCreateFields,
  eventToRsvpFormState,
} from "@/components/calendar/EventRsvpCreateFields";
import { Button } from "@/components/ui";
import type { EventRsvpStatus, EventRsvpView } from "@/lib/event-rsvp-types";
import { eventRsvpStatusLabel } from "@/lib/event-rsvp-types";
import {
  daysUntilDeadline,
  formatRsvpDeadlineLabel,
} from "@/lib/event-rsvp-utils";
import type { ChurchEvent } from "@/lib/types";

const STATUS_OPTIONS: EventRsvpStatus[] = ["going", "maybe", "not_going"];

type EventRsvpPanelProps = {
  event: ChurchEvent;
  canManage: boolean;
  onEventUpdated?: (event: ChurchEvent) => void;
};

export function EventRsvpPanel({ event, canManage, onEventUpdated }: EventRsvpPanelProps) {
  const { user } = useAuth();
  const [rsvp, setRsvp] = useState<EventRsvpView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [settings, setSettings] = useState(() => eventToRsvpFormState(event));
  const [showSettings, setShowSettings] = useState(false);

  async function loadRsvp() {
    setLoading(true);
    const response = await fetch(`/api/events/${encodeURIComponent(event.id)}/rsvp`);
    const data = await response.json();
    setLoading(false);
    if (response.ok) {
      setRsvp(data.rsvp ?? null);
      setNote(data.rsvp?.myNote ?? "");
    }
  }

  useEffect(() => {
    void loadRsvp();
  }, [event.id, event.rsvpEnabled]);

  useEffect(() => {
    setSettings(eventToRsvpFormState(event));
  }, [event]);

  if (loading) {
    return null;
  }

  if (!rsvp?.enabled && !canManage) {
    return null;
  }

  if (rsvp?.enabled && user && !rsvp.inAudience && !canManage) {
    return (
      <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50/80 p-4">
        <p className="text-sm text-night-700">
          RSVP is open for{" "}
          <strong>{rsvp.audienceGroupName ?? "selected group"}</strong> members.
        </p>
      </div>
    );
  }

  async function submitStatus(status: EventRsvpStatus) {
    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/events/${encodeURIComponent(event.id)}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not save RSVP.");
      return;
    }
    setRsvp(data.rsvp);
    setMessage("RSVP saved.");
  }

  async function saveSettings() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: event.id,
        ...eventRsvpFormToPayload(settings),
        rsvpGroupId: settings.rsvpAudience === "group" ? event.groupId ?? null : null,
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not save RSVP settings.");
      return;
    }
    onEventUpdated?.(data.event);
    setSettings(eventToRsvpFormState(data.event));
    setShowSettings(false);
    setMessage(settings.rsvpEnabled ? "RSVP is on for this event." : "RSVP turned off.");
    void loadRsvp();
  }

  const deadlineLabel = formatRsvpDeadlineLabel(rsvp?.deadline);
  const daysLeft = daysUntilDeadline(rsvp?.deadline);

  return (
    <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50/80 p-4">
      {canManage ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-night-900">Event RSVP</p>
          <button
            type="button"
            onClick={() => setShowSettings((current) => !current)}
            className="text-xs font-semibold text-teal-800 underline-offset-2 hover:underline"
          >
            {showSettings ? "Hide settings" : rsvp?.enabled ? "Edit RSVP" : "Enable RSVP"}
          </button>
        </div>
      ) : rsvp?.enabled ? (
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-800">
          RSVP requested
          {deadlineLabel
            ? daysLeft && daysLeft > 0
              ? ` · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
              : rsvp.closed
                ? " · closed"
                : ""
            : ""}
        </p>
      ) : null}

      {showSettings && canManage ? (
        <div className="mt-3">
          <EventRsvpCreateFields
            state={settings}
            onChange={setSettings}
            defaultAudience={event.groupId ? "group" : "church"}
            compact
          />
          <Button className="mt-3" onClick={saveSettings} disabled={busy}>
            {busy ? "Saving…" : "Save RSVP settings"}
          </Button>
        </div>
      ) : null}

      {rsvp?.enabled && rsvp.instructions ? (
        <p className="mt-3 text-sm text-night-700">{rsvp.instructions}</p>
      ) : null}

      {rsvp?.enabled && user && rsvp.canRespond ? (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((status) => {
              const active = rsvp.myStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  disabled={busy}
                  onClick={() => submitStatus(status)}
                  className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-night-900 text-white"
                      : "bg-white text-night-800 ring-1 ring-night-900/10 hover:bg-sand-100"
                  }`}
                >
                  {eventRsvpStatusLabel(status)}
                </button>
              );
            })}
          </div>
          <label className="mt-3 block">
            <span className="text-xs font-semibold text-night-600">Optional note</span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Can bring snacks, need a ride, etc."
              className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </label>
        </div>
      ) : null}

      {rsvp?.enabled && user && !rsvp.canRespond && !rsvp.closed && rsvp.myStatus ? (
        <p className="mt-3 text-sm text-night-700">
          You responded: <strong>{eventRsvpStatusLabel(rsvp.myStatus)}</strong>
        </p>
      ) : null}

      {rsvp?.enabled && rsvp.closed && !rsvp.myStatus ? (
        <p className="mt-3 text-sm text-night-600">RSVP is closed for this event.</p>
      ) : null}

      {rsvp?.enabled && !user ? (
        <p className="mt-3 text-sm text-night-600">Sign in to RSVP for this event.</p>
      ) : null}

      {rsvp?.enabled && rsvp.summary ? (
        <p className="mt-3 text-sm text-night-700">
          {rsvp.summary.going} going · {rsvp.summary.maybe} maybe · {rsvp.summary.notGoing}{" "}
          can&apos;t go
          {rsvp.summary.capacity
            ? ` · ${rsvp.summary.going}/${rsvp.summary.capacity} spots`
            : ""}
        </p>
      ) : null}

      {rsvp?.enabled && rsvp.roster && rsvp.roster.length > 0 ? (
        <div className="mt-4 border-t border-teal-200/80 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-night-500">
            Responses (organizers only)
          </p>
          <ul className="mt-2 space-y-2">
            {rsvp.roster.map((entry) => (
              <li key={entry.userId} className="text-sm text-night-800">
                <span className="font-semibold">{entry.userName}</span>
                <span className="text-night-500"> · {eventRsvpStatusLabel(entry.status)}</span>
                {entry.note ? (
                  <span className="block text-xs text-night-600">&ldquo;{entry.note}&rdquo;</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm text-night-700">{message}</p> : null}
    </div>
  );
}
