"use client";

import { useEffect, useMemo, useState } from "react";
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
import { EventShareTools } from "@/components/share/EventShareTools";
import { CALENDAR_GROUP_TABS } from "@/lib/church-groups";
import { isOutlookSyncedEventId } from "@/lib/calendar-utils";
import type { ArtworkFields } from "@/lib/content-artwork";
import type { UnavailabilityRequest } from "@/lib/member-types";
import type { ChurchEvent } from "@/lib/types";
import { Button, Card } from "@/components/ui";

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

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

function RequestForm({
  group,
  signInNextUrl,
  onSubmitted,
}: {
  group: "choir" | "pastors";
  signInNextUrl: string;
  onSubmitted: () => void;
}) {
  const { user } = useAuth();
  const [personName, setPersonName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setPersonName(user.name);
    }
  }, [user]);

  if (!user) {
    return (
      <Card className="mb-6">
        <p className="text-sm text-night-600">
          Sign in and join this ministry group to request time away.
        </p>
        <Button href={`/sign-in?next=${encodeURIComponent(signInNextUrl)}`} className="mt-4">
          Sign in
        </Button>
      </Card>
    );
  }

  async function submit() {
    const response = await fetch("/api/unavailability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personName, startDate, endDate, reason, group }),
    });
    const data = await response.json();
    if (response.ok) {
      setMessage("Request submitted — waiting for group admin approval.");
      setPersonName("");
      setStartDate("");
      setEndDate("");
      setReason("");
      onSubmitted();
    } else {
      setMessage(data.error ?? "Could not submit request.");
    }
  }

  return (
    <Card className="mb-6">
      <h3 className="font-display text-lg font-semibold text-night-900">Request time away</h3>
      <p className="mt-1 text-sm text-night-600">
        Submit vacation or unavailable dates. Once approved, everyone in this group can see it.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          value={personName}
          onChange={(event) => setPersonName(event.target.value)}
          placeholder="Your name"
          className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />
        <input
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />
        <input
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Reason (vacation, travel, etc.)"
          className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />
      </div>
      {message && <p className="mt-3 text-sm text-night-600">{message}</p>}
      <Button className="mt-4" onClick={submit}>
        Submit for approval
      </Button>
    </Card>
  );
}

function GroupAdminApproval({
  requests,
  canReview,
  onReviewed,
}: {
  requests: UnavailabilityRequest[];
  canReview: boolean;
  onReviewed: () => void;
}) {
  const pending = requests.filter((item) => item.status === "pending");

  async function review(id: string, status: "approved" | "rejected") {
    await fetch("/api/unavailability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "review",
        id,
        status,
      }),
    });
    onReviewed();
  }

  if (!canReview || pending.length === 0) return null;

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50/40">
      <h3 className="font-semibold text-night-900">Pending approvals</h3>
      <p className="mt-1 text-sm text-night-600">
        Group leaders and Admin Group members can approve time-away requests.
      </p>
      <ul className="mt-4 space-y-3">
        {pending.map((item) => (
          <li key={item.id} className="rounded-xl bg-white p-4 ring-1 ring-night-900/5">
            <p className="font-medium text-night-900">{item.personName}</p>
            <p className="text-sm text-night-600">
              {formatDate(item.startDate)} – {formatDate(item.endDate)} · {item.reason}
            </p>
            <div className="mt-3 flex gap-2">
              <Button onClick={() => review(item.id, "approved")}>Approve</Button>
              <Button variant="secondary" onClick={() => review(item.id, "rejected")}>
                Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function GroupEventsSection({
  groupId,
  groupLabel,
  signInNextUrl,
}: {
  groupId: string;
  groupLabel: string;
  signInNextUrl: string;
}) {
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
  const [rsvpForm, setRsvpForm] = useState(() => defaultEventRsvpFormState("group"));

  async function loadEvents() {
    setLoading(true);
    const response = await fetch(`/api/events?groupId=${encodeURIComponent(groupId)}`);
    const data = await response.json();
    if (response.ok) {
      setEvents(data.events ?? []);
      setCanManage(Boolean(data.canManage));
      setMessage(null);
    } else {
      setEvents([]);
      setMessage(data.error ?? "Could not load group events.");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (user) {
      loadEvents();
    } else {
      setLoading(false);
    }
  }, [user, groupId]);

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
        groupId,
        startsOn: startsOn || undefined,
        endsOn: endsOn || undefined,
        recurringWeekday: recurringWeekday === "" ? undefined : Number(recurringWeekday),
        ...eventRsvpFormToPayload(rsvpForm),
        rsvpGroupId: rsvpForm.rsvpAudience === "group" ? groupId : null,
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
      setRsvpForm(defaultEventRsvpFormState("group"));
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
    if (response.ok) {
      loadEvents();
    } else {
      const data = await response.json();
      setMessage(data.error ?? "Could not delete event.");
    }
  }

  if (!user) {
    return (
      <Card className="mb-6">
        <p className="text-sm text-night-600">
          Sign in to view {groupLabel} calendar events.
        </p>
        <Button href={`/sign-in?next=${encodeURIComponent(signInNextUrl)}`} className="mt-4">
          Sign in
        </Button>
      </Card>
    );
  }

  return (
    <>
      {canManage && (
        <Card className="mb-6">
          <h3 className="font-display text-lg font-semibold text-night-900">
            Manage {groupLabel} events
          </h3>
          <p className="mt-1 text-sm text-night-600">
            Group leaders can add events visible to all {groupLabel} members.
          </p>
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
              placeholder="Date label"
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
              defaultAudience="group"
            />
          </div>
          {message && <p className="mt-3 text-sm text-night-600">{message}</p>}
          <Button className="mt-4" onClick={addEvent}>
            Add {groupLabel} event
          </Button>
        </Card>
      )}

      <CalendarMonthView
        items={events}
        emptyDayLabel={`No ${groupLabel.toLowerCase()} events on this day.`}
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
        <Card className="mb-6">
          <p className="text-sm text-night-500">Loading events…</p>
        </Card>
      )}
    </>
  );
}

function UnavailabilitySection({
  group,
  signInNextUrl,
}: {
  group: "choir" | "pastors";
  signInNextUrl: string;
}) {
  const [requests, setRequests] = useState<UnavailabilityRequest[]>([]);
  const [canReview, setCanReview] = useState(false);

  async function loadRequests() {
    const response = await fetch(`/api/unavailability?group=${group}`);
    const data = await response.json();
    if (response.ok) {
      setRequests(data.requests ?? []);
      setCanReview(Boolean(data.canReview));
    } else {
      setRequests([]);
      setCanReview(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, [group]);

  const approved = useMemo(
    () => requests.filter((item) => item.status === "approved"),
    [requests],
  );

  const availabilityLabel = group === "choir" ? "Choir availability" : "Pastor availability";

  return (
    <>
      <RequestForm group={group} signInNextUrl={signInNextUrl} onSubmitted={loadRequests} />
      <GroupAdminApproval
        requests={requests}
        canReview={canReview}
        onReviewed={loadRequests}
      />
      <Card>
        <h3 className="font-display text-lg font-semibold text-night-900">{availabilityLabel}</h3>
        <ul className="mt-4 space-y-3">
          {approved.length === 0 ? (
            <li className="text-sm text-night-500">No approved absences yet.</li>
          ) : (
            approved.map((item) => (
              <li key={item.id} className="rounded-xl bg-rose-50 px-4 py-3 text-sm">
                <span className="font-semibold text-night-900">{item.personName}</span>{" "}
                unavailable {formatDate(item.startDate)} – {formatDate(item.endDate)}
                <span className="block text-night-500">{item.reason}</span>
              </li>
            ))
          )}
        </ul>
      </Card>
    </>
  );
}

export function GroupCalendarPanel({
  groupId,
  groupLabel,
  signInNextUrl,
  showWorshipPlanner = false,
  unavailabilityGroup = null,
}: {
  groupId: string;
  groupLabel: string;
  signInNextUrl: string;
  showWorshipPlanner?: boolean;
  unavailabilityGroup?: "choir" | "pastors" | null;
}) {
  return (
    <div className="mt-4">
      {showWorshipPlanner && groupId === CALENDAR_GROUP_TABS.choir ? (
        <Card className="mb-6 bg-violet-50 ring-violet-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-night-900">
                Worship planner
              </h3>
              <p className="mt-1 text-sm text-night-600">
                Setlists, team readiness, and rehearsal notes for each service.
              </p>
            </div>
            <Button href="/worship">Open planner</Button>
          </div>
        </Card>
      ) : null}

      <GroupEventsSection
        groupId={groupId}
        groupLabel={groupLabel}
        signInNextUrl={signInNextUrl}
      />

      {unavailabilityGroup ? (
        <div className="mt-6 space-y-6">
          <UnavailabilitySection group={unavailabilityGroup} signInNextUrl={signInNextUrl} />
        </div>
      ) : null}
    </div>
  );
}
