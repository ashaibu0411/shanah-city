"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CalendarMonthView } from "@/components/calendar/CalendarMonthView";
import { EventCalendarFields } from "@/components/calendar/EventCalendarFields";
import { MeetingsCalendarPanel } from "@/components/calendar/MeetingsCalendarPanel";
import { CALENDAR_GROUP_TABS } from "@/lib/church-groups";
import { isOutlookSyncedEventId } from "@/lib/calendar-utils";
import type { UnavailabilityRequest } from "@/lib/member-types";
import type { ChurchEvent } from "@/lib/types";
import { Button, Card } from "@/components/ui";

type CalendarTab = "church" | "choir" | "pastors" | "meetings";

function EventDetailCard({
  event,
  canManage,
  onRemove,
}: {
  event: ChurchEvent;
  canManage: boolean;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-xl bg-sand-50 p-4 ring-1 ring-night-900/5">
      <p className="text-sm font-medium text-sand-600">{event.date}</p>
      <h3 className="mt-1 font-display text-lg font-semibold text-night-900">{event.title}</h3>
      <p className="mt-2 text-sm text-night-600">
        {event.time} · {event.location}
      </p>
      {isOutlookSyncedEventId(event.id) ? (
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-violet-700">
          Synced from Outlook
        </p>
      ) : canManage ? (
        <Button variant="secondary" className="mt-3" onClick={() => onRemove(event.id)}>
          Remove
        </Button>
      ) : null}
    </div>
  );
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function RequestForm({
  group,
  onSubmitted,
}: {
  group: "choir" | "pastors";
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
        <Button href="/sign-in?next=/calendar" className="mt-4">
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
      <h3 className="font-display text-lg font-semibold text-night-900">
        Request time away
      </h3>
      <p className="mt-1 text-sm text-night-600">
        Submit vacation or unavailable dates. Once approved, everyone on this calendar can see it.
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
        Group admins and Admin Group members can approve time-away requests.
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

function ChurchEventsPanel() {
  const { user } = useAuth();
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
          <EventDetailCard event={event} canManage={canManage} onRemove={removeEvent} />
        )}
      />

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <p className="text-sm text-night-500">Loading events…</p>
          </Card>
        ) : events.length === 0 ? (
          <Card>
            <p className="text-sm text-night-500">No events listed yet.</p>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id}>
              <p className="text-sm font-medium text-sand-600">{event.date}</p>
              <h3 className="mt-1 font-display text-xl font-semibold text-night-900">
                {event.title}
              </h3>
              <p className="mt-2 text-sm text-night-600">
                {event.time} · {event.location}
              </p>
              {isOutlookSyncedEventId(event.id) ? (
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-violet-700">
                  Synced from Outlook
                </p>
              ) : canManage ? (
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => removeEvent(event.id)}
                >
                  Remove
                </Button>
              ) : null}
            </Card>
          ))
        )}
      </div>
    </>
  );
}

function GroupEventsPanel({
  groupId,
  groupLabel,
}: {
  groupId: string;
  groupLabel: string;
}) {
  const { user } = useAuth();
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
        <Button href="/sign-in?next=/calendar" className="mt-4">
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
            Group admins can add events visible to {groupLabel} members.
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
          <EventDetailCard event={event} canManage={canManage} onRemove={removeEvent} />
        )}
      />

      <div className="mb-6 grid gap-4">
        {loading ? (
          <Card>
            <p className="text-sm text-night-500">Loading events…</p>
          </Card>
        ) : events.length === 0 ? (
          <Card>
            <p className="text-sm text-night-500">No {groupLabel.toLowerCase()} events yet.</p>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id}>
              <p className="text-sm font-medium text-sand-600">{event.date}</p>
              <h3 className="mt-1 font-display text-xl font-semibold text-night-900">
                {event.title}
              </h3>
              <p className="mt-2 text-sm text-night-600">
                {event.time} · {event.location}
              </p>
              {canManage && (
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => removeEvent(event.id)}
                >
                  Remove
                </Button>
              )}
            </Card>
          ))
        )}
      </div>
    </>
  );
}

export function CalendarHub() {
  const { permissions } = useAuth();
  const [tab, setTab] = useState<CalendarTab>("church");
  const [requests, setRequests] = useState<UnavailabilityRequest[]>([]);
  const [canReview, setCanReview] = useState(false);

  async function loadRequests(group: "choir" | "pastors") {
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
    if (tab === "choir") loadRequests("choir");
    if (tab === "pastors") loadRequests("pastors");
  }, [tab]);

  const approved = useMemo(
    () => requests.filter((item) => item.status === "approved"),
    [requests],
  );

  const tabs: { id: CalendarTab; label: string }[] = [
    { id: "church", label: "Church" },
    { id: "choir", label: "Choir" },
    { id: "pastors", label: "Pastors" },
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
          </button>
        ))}
      </div>

      {tab === "church" && <ChurchEventsPanel />}

      {tab === "choir" && (
        <>
          {permissions.canAccessWorshipPlanner && (
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
          )}
          <GroupEventsPanel groupId={CALENDAR_GROUP_TABS.choir} groupLabel="Choir" />
          <RequestForm group="choir" onSubmitted={() => loadRequests("choir")} />
          <GroupAdminApproval
            requests={requests}
            canReview={canReview}
            onReviewed={() => loadRequests("choir")}
          />
          <Card>
            <h3 className="font-display text-lg font-semibold text-night-900">
              Choir availability
            </h3>
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
      )}

      {tab === "pastors" && (
        <>
          <GroupEventsPanel groupId={CALENDAR_GROUP_TABS.pastors} groupLabel="Pastors" />
          <RequestForm group="pastors" onSubmitted={() => loadRequests("pastors")} />
          <GroupAdminApproval
            requests={requests}
            canReview={canReview}
            onReviewed={() => loadRequests("pastors")}
          />
          <Card>
            <h3 className="font-display text-lg font-semibold text-night-900">
              Pastor availability
            </h3>
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
      )}

      {tab === "meetings" && <MeetingsCalendarPanel />}
    </div>
  );
}
