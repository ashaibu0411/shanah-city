"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { MeetingsCalendarPanel } from "@/components/calendar/MeetingsCalendarPanel";
import { EventShareTools } from "@/components/share/EventShareTools";
import { isOutlookSyncedEventId } from "@/lib/calendar-utils";
import type { ArtworkFields } from "@/lib/content-artwork";
import type { ChurchEvent } from "@/lib/types";
import { Button, Card } from "@/components/ui";

type CalendarTab = "church" | "meetings";

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
  return (
    <div
      id={`event-${event.id}`}
      className={`rounded-xl bg-sand-50 p-4 ring-1 ${
        highlighted ? "ring-2 ring-gold-500" : "ring-night-900/5"
      }`}
    >
      <p className="text-sm font-medium text-sand-600">{event.date}</p>
      <h3 className="mt-1 font-display text-lg font-semibold text-night-900">{event.title}</h3>
      <p className="mt-2 text-sm text-night-600">
        {event.time} · {event.location}
      </p>
      {needsRsvp ? (
        <div className="mt-2">
          <EventRsvpBadge />
        </div>
      ) : event.rsvpEnabled ? (
        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-800">
          RSVP requested
        </p>
      ) : null}
      {isOutlookSyncedEventId(event.id) ? (
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-violet-700">
          Synced from Outlook
        </p>
      ) : canManage ? (
        <Button variant="secondary" className="mt-3" onClick={() => onRemove(event.id)}>
          Remove
        </Button>
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
    </div>
  );
}

function ChurchEventsPanel() {
  const { user } = useAuth();
  const { pendingEventIds, refresh: refreshRsvps } = useMyEventRsvps(Boolean(user));
  const searchParams = useSearchParams();
  const highlightEventId = searchParams.get("event");
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
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
    loadEvents();
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
      loadEvents();
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
      loadEvents();
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
      loadEvents();
    } else {
      setMessage(data.error ?? "Could not sync Outlook.");
    }
  }

  return (
    <>
      {!user ? (
        <Card className="mb-6">
          <h3 className="font-display text-lg font-semibold text-night-900">
            Manage church events
          </h3>
          <p className="mt-1 text-sm text-night-600">
            Sign in to view events. Only approved Admin Group members can add or remove
            events.
          </p>
          <Button href="/sign-in?next=/calendar" className="mt-4">
            Sign in
          </Button>
        </Card>
      ) : canManage ? (
        <Card className="mb-6">
          <h3 className="font-display text-lg font-semibold text-night-900">
            Manage church events
          </h3>
          <p className="mt-1 text-sm text-night-600">
            Church events can sync from the Outlook calendar on admin@shanahcity.org. You can
            still add one-off events here.
          </p>
          <div className="mt-4 rounded-2xl bg-violet-50 p-4 ring-1 ring-violet-100">
            <p className="text-sm font-semibold text-night-900">Outlook calendar</p>
            <p className="mt-1 text-sm text-night-600">
              {outlookConfigured
                ? "Connected. Changes in Outlook appear here after a daily sync, or tap Sync now."
                : "Not connected yet. Publish the church calendar from Outlook and add OUTLOOK_CALENDAR_ICS_URL in Vercel."}
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
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <input
              value={date}
              onChange={(event) => setDate(event.target.value)}
              placeholder="Date label (e.g. Every Friday)"
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <input
              value={time}
              onChange={(event) => setTime(event.target.value)}
              placeholder="Time"
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Location"
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
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
          {message && <p className="mt-3 text-sm text-night-600">{message}</p>}
          <Button className="mt-4" onClick={addEvent}>
            Add event
          </Button>
        </Card>
      ) : (
        <Card className="mb-6 border-sand-200 bg-sand-50/60">
          <p className="text-sm text-night-600">
            Church events are managed by the Admin Group. If you need access, request{" "}
            <strong>Admin Group</strong> during sign-up or ask an admin to approve you.
          </p>
        </Card>
      )}

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

      {loading && (
        <Card>
          <p className="text-sm text-night-500">Loading events…</p>
        </Card>
      )}
    </>
  );
}

export function CalendarHub() {
  const { user } = useAuth();
  const { pendingCount } = useMyEventRsvps(Boolean(user));
  const [tab, setTab] = useState<CalendarTab>("church");

  const tabs: { id: CalendarTab; label: string }[] = [
    { id: "church", label: "Church" },
    { id: "meetings", label: "Meetings" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === item.id
                ? "bg-night-900 text-sand-50"
                : "bg-white text-night-600 ring-1 ring-night-900/10 hover:bg-sand-100"
            }`}
          >
            {item.label}
            {item.id === "church" && pendingCount > 0 ? (
              <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-teal-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "church" && <ChurchEventsPanel />}
      {tab === "meetings" && <MeetingsCalendarPanel />}
    </div>
  );
}
