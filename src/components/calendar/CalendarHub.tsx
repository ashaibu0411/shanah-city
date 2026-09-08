"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppShell } from "@/components/app/AppShellContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { CalendarMonthView } from "@/components/calendar/CalendarMonthView";
import { EventCalendarFields } from "@/components/calendar/EventCalendarFields";
import {
  defaultEventRsvpFormState,
  eventRsvpFormToPayload,
  EventRsvpCreateFields,
} from "@/components/calendar/EventRsvpCreateFields";
import { EventRsvpPanel } from "@/components/calendar/EventRsvpPanel";
import { EventRsvpBadge } from "@/components/calendar/EventRsvpBadge";
import { useMyEventRsvps } from "@/components/calendar/useMyEventRsvps";
import { EventShareTools } from "@/components/share/EventShareTools";
import { isOutlookSyncedEventId } from "@/lib/calendar-utils";
import type { ArtworkFields } from "@/lib/content-artwork";
import type { ChurchEvent } from "@/lib/types";
import { Button, Card } from "@/components/ui";

function EventDetailCard({
  event,
  canManage,
  onRemove,
  onArtworkChange,
  onEventUpdated,
  onRsvpChanged,
  needsRsvp = false,
  highlighted = false,
}: {
  event: ChurchEvent;
  canManage: boolean;
  onRemove: (id: string) => void;
  onArtworkChange?: (id: string, artwork: ArtworkFields) => void;
  onEventUpdated?: (event: ChurchEvent) => void;
  onRsvpChanged?: () => void;
  needsRsvp?: boolean;
  highlighted?: boolean;
}) {
  const { isMobileApp } = useAppShell();

  return (
    <div
      id={`event-${event.id}`}
      className={`p-4 ring-1 ${
        isMobileApp
          ? `mobile-premium-section ${highlighted ? "ring-2 ring-amber-400" : ""}`
          : `rounded-xl bg-sand-50 ${highlighted ? "ring-2 ring-gold-500" : "ring-night-900/5"}`
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-sand-600">{event.date}</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-night-900">{event.title}</h3>
          <p className="mt-1 text-sm text-night-600">
            {event.time} · {event.location}
          </p>
        </div>
        {needsRsvp ? <EventRsvpBadge /> : null}
      </div>
      {event.rsvpEnabled && !needsRsvp ? (
        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-800">
          RSVP requested
        </p>
      ) : null}
      {isOutlookSyncedEventId(event.id) ? (
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-violet-700">
          Synced from Outlook
        </p>
      ) : null}
      {canManage && onArtworkChange ? (
        <EventShareTools
          event={event}
          onArtworkChange={(artwork) => onArtworkChange(event.id, artwork)}
        />
      ) : null}
      <EventRsvpPanel
        event={event}
        canManage={canManage}
        onEventUpdated={onEventUpdated}
        onRsvpChanged={onRsvpChanged}
      />
      {isOutlookSyncedEventId(event.id) ? null : canManage ? (
        <Button variant="secondary" className="mt-3" onClick={() => onRemove(event.id)}>
          Remove
        </Button>
      ) : null}
    </div>
  );
}

export function CalendarHub() {
  const { user } = useAuth();
  const { pendingEventIds, refresh: refreshRsvps } = useMyEventRsvps(Boolean(user));
  const searchParams = useSearchParams();
  const highlightEventId = searchParams.get("event");
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [recurringWeekday, setRecurringWeekday] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [outlookConfigured, setOutlookConfigured] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [rsvpForm, setRsvpForm] = useState(() => defaultEventRsvpFormState("church"));

  async function loadEvents() {
    setLoading(true);
    const [eventsResponse, syncResponse] = await Promise.all([
      fetch("/api/events?groupId=church"),
      fetch("/api/events/sync"),
    ]);
    const data = await eventsResponse.json();
    const syncData = await syncResponse.json().catch(() => ({ configured: false }));
    setEvents(data.events ?? []);
    setCanManage(Boolean(data.canManage));
    setOutlookConfigured(Boolean(syncData.configured));
    setLoading(false);
  }

  useEffect(() => {
    void loadEvents();
  }, []);

  useEffect(() => {
    if (!highlightEventId || events.length === 0) return;
    const element = document.getElementById(`event-${highlightEventId}`);
    if (!element) return;
    window.setTimeout(() => {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [highlightEventId, events]);

  function updateEventArtwork(id: string, artwork: ArtworkFields) {
    setEvents((current) =>
      current.map((event) => (event.id === id ? { ...event, ...artwork } : event)),
    );
  }

  function updateEventInList(updated: ChurchEvent) {
    setEvents((current) =>
      current.map((entry) => (entry.id === updated.id ? { ...entry, ...updated } : entry)),
    );
  }

  async function addEvent() {
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        date,
        time,
        location,
        startsOn: startsOn || undefined,
        endsOn: endsOn || undefined,
        recurringWeekday: recurringWeekday === "" ? undefined : Number(recurringWeekday),
        ...eventRsvpFormToPayload(rsvpForm),
        notifyAudience: rsvpForm.notifyMembers,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setMessage("Event added.");
      setTitle("");
      setDate("");
      setTime("");
      setLocation("");
      setStartsOn("");
      setEndsOn("");
      setRecurringWeekday("");
      setRsvpForm(defaultEventRsvpFormState("church"));
      void loadEvents();
    } else {
      setMessage(data.error ?? "Could not add event.");
    }
  }

  async function removeEvent(id: string) {
    const response = await fetch("/api/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await response.json();
    if (response.ok) {
      void loadEvents();
    } else {
      setMessage(data.error ?? "Could not delete event.");
    }
  }

  async function syncOutlook() {
    setSyncing(true);
    const response = await fetch("/api/events/sync", { method: "POST" });
    const data = await response.json();
    setSyncing(false);
    if (response.ok) {
      setMessage(
        `Outlook synced. ${data.created} new, ${data.updated} updated, ${data.removed} removed.`,
      );
      void loadEvents();
    } else {
      setMessage(data.error ?? "Could not sync Outlook.");
    }
  }

  return (
    <div className="space-y-5">
      <Card className="border-sand-200/80 bg-sand-50/50 p-4 sm:p-5">
        <p className="text-sm text-night-700">
          Worship services, outreach, and church-wide events. Tap a day for times, location, and RSVP.
          Ministry Zoom links are on{" "}
          <Link href="/meetings" className="font-semibold text-teal-800 hover:underline">
            Meetings
          </Link>
          .
        </p>
        {pendingEventIds.size > 0 ? (
          <p className="mt-2 text-sm font-semibold text-amber-800">
            You have {pendingEventIds.size} event RSVP
            {pendingEventIds.size === 1 ? "" : "s"} waiting below.
          </p>
        ) : null}
      </Card>

      {loading ? (
        <Card>
          <p className="text-sm text-night-500">Loading calendar…</p>
        </Card>
      ) : (
        <CalendarMonthView
          items={events}
          emptyDayLabel="No church events on this day."
          renderItem={(event) => (
            <EventDetailCard
              event={event}
              canManage={canManage}
              onRemove={removeEvent}
              onArtworkChange={canManage ? updateEventArtwork : undefined}
              onEventUpdated={updateEventInList}
              onRsvpChanged={refreshRsvps}
              needsRsvp={pendingEventIds.has(event.id)}
              highlighted={Boolean(highlightEventId && event.id === highlightEventId)}
            />
          )}
        />
      )}

      {canManage ? (
        <Card className="border-dashed border-night-900/15 bg-sand-50/40">
          <button
            type="button"
            onClick={() => setManageOpen((value) => !value)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-night-500">
                Admin Group
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold text-night-900">
                Manage church calendar
              </h3>
            </div>
            <span className="text-sm font-semibold text-teal-800">
              {manageOpen ? "Hide" : "Show"}
            </span>
          </button>

          {manageOpen ? (
            <div className="mt-4 border-t border-night-900/8 pt-4">
              <p className="text-sm text-night-600">
                Outlook syncs daily, or tap Sync now. Add one-off events here when needed.
              </p>
              <div className="mt-4 rounded-2xl bg-violet-50 p-4 ring-1 ring-violet-100">
                <p className="text-sm font-semibold text-night-900">Outlook calendar</p>
                <p className="mt-1 text-sm text-night-600">
                  {outlookConfigured
                    ? "Connected. Changes in Outlook appear here after sync."
                    : "Not connected yet. Add OUTLOOK_CALENDAR_ICS_URL in Vercel."}
                </p>
                <Button
                  className="mt-3"
                  variant="secondary"
                  disabled={syncing || !outlookConfigured}
                  onClick={syncOutlook}
                >
                  {syncing ? "Syncing..." : "Sync now from Outlook"}
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Title"
                  className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                />
                <input
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  placeholder="Date label (e.g. Every Friday)"
                  className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                />
                <input
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  placeholder="Time"
                  className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                />
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Location"
                  className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                />
                <EventCalendarFields
                  startsOn={startsOn}
                  endsOn={endsOn}
                  recurringWeekday={recurringWeekday}
                  onStartsOnChange={setStartsOn}
                  onEndsOnChange={setEndsOn}
                  onRecurringWeekdayChange={setRecurringWeekday}
                />
                <EventRsvpCreateFields
                  state={rsvpForm}
                  onChange={setRsvpForm}
                  defaultAudience="church"
                />
              </div>
              {message ? <p className="mt-3 text-sm text-night-600">{message}</p> : null}
              <Button className="mt-4" onClick={addEvent}>
                Add event
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
