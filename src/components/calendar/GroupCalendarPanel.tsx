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
import { EventRsvpBadge } from "@/components/calendar/EventRsvpBadge";
import { useMyEventRsvps } from "@/components/calendar/useMyEventRsvps";
import { GroupServiceSchedulePanel } from "@/components/calendar/ChoirServiceSchedulePanel";
import {
  getGroupServiceScheduleConfig,
  groupHasServiceSchedule,
} from "@/lib/group-service-schedule-config";
import { CALENDAR_GROUP_TABS } from "@/lib/church-groups";
import { isOutlookSyncedEventId } from "@/lib/calendar-utils";
import {
  calendarPreviewFromEvent,
  groupSyncedEventHint,
  isGroupScheduleDetailEvent,
  isGroupSyncedCalendarEventId,
} from "@/lib/choir-calendar-utils";
import type { UnavailabilityRequest } from "@/lib/member-types";
import { activeApprovedAvailability, denverTodayDateKey } from "@/lib/unavailability-display";
import type { ChurchEvent } from "@/lib/types";
import { Button, Card } from "@/components/ui";
import {
  worshipPlanningUntilIso,
  type WorshipServicePlan,
} from "@/lib/worship-types";

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
  needsRsvp = false,
  highlighted = false,
  simpleView = false,
}: {
  event: ChurchEvent;
  canManage: boolean;
  onRemove: (id: string) => void;
  needsRsvp?: boolean;
  highlighted?: boolean;
  simpleView?: boolean;
}) {
  const synced = isGroupSyncedCalendarEventId(event.id);
  const preview = calendarPreviewFromEvent(event);
  const scheduleDetail = isGroupScheduleDetailEvent(event.id);

  return (
    <div
      id={`event-${event.id}`}
      className={`rounded-xl bg-sand-50 p-4 ring-1 ${
        highlighted ? "ring-2 ring-gold-500" : "ring-night-900/5"
      }`}
    >
      {!simpleView || !scheduleDetail ? (
        <>
          <p className="text-sm font-medium text-sand-600">{event.date}</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-night-900">{event.title}</h3>
        </>
      ) : null}
      {scheduleDetail ? (
        <pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-night-800">{preview}</pre>
      ) : (
        <p className="mt-2 text-sm text-night-600">
          {event.time}
          {event.location ? ` · ${event.location}` : ""}
        </p>
      )}
      {needsRsvp ? (
        <div className="mt-2">
          <EventRsvpBadge />
        </div>
      ) : null}
      {isOutlookSyncedEventId(event.id) ? (
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-violet-700">
          Synced from Outlook
        </p>
      ) : synced ? (
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-sky-800">
          {groupSyncedEventHint(event.id)}
        </p>
      ) : canManage ? (
        <Button variant="secondary" className="mt-3" onClick={() => onRemove(event.id)}>
          Remove
        </Button>
      ) : null}
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
        U.S. calendar dates (Mountain Time). Once approved, time away appears on the worship calendar and
        Availability Center.
        {group === "choir" ? (
          <>
            {" "}
            Prefer the mobile form?{" "}
            <a href="/groups/group-choir/availability?tab=time-away" className="font-semibold underline">
              Open Time Away tab
            </a>
            .
          </>
        ) : null}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="sr-only" htmlFor="unavail-name">
          Your name
        </label>
        <input
          id="unavail-name"
          value={personName}
          onChange={(event) => setPersonName(event.target.value)}
          placeholder="Your name"
          className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />
        <label className="sr-only" htmlFor="unavail-start">
          First day away
        </label>
        <input
          id="unavail-start"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          aria-label="First day away"
          className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />
        <label className="sr-only" htmlFor="unavail-end">
          Last day away
        </label>
        <input
          id="unavail-end"
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={(event) => setEndDate(event.target.value)}
          aria-label="Last day away"
          className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />
        <label className="sr-only" htmlFor="unavail-reason">
          Reason
        </label>
        <input
          id="unavail-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Reason (vacation, sick leave, travel, etc.)"
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

export function GroupEventsSection({
  groupId,
  groupLabel,
  signInNextUrl,
  reloadKey = 0,
  worshipPlans,
  canManageWorship = false,
  linkWorshipPlanner = false,
}: {
  groupId: string;
  groupLabel: string;
  signInNextUrl: string;
  reloadKey?: number;
  worshipPlans?: WorshipServicePlan[];
  canManageWorship?: boolean;
  linkWorshipPlanner?: boolean;
}) {
  const scheduleConfig = getGroupServiceScheduleConfig(groupId);
  const usesServiceSchedule = groupHasServiceSchedule(groupId);
  const hideManualEventForm = scheduleConfig?.preferScheduleOverManualEvents ?? false;
  const { user } = useAuth();
  const { pendingEventIds } = useMyEventRsvps(Boolean(user) && !hideManualEventForm);
  const searchParams = useSearchParams();
  const highlightEventId = searchParams.get("event");
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [title, setTitle] = useState("");
  const [eventDay, setEventDay] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("Shanah City");
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
  }, [user, groupId, reloadKey]);

  const calendarItems = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        calendarPreview: calendarPreviewFromEvent(event),
      })),
    [events],
  );

  useEffect(() => {
    if (!highlightEventId || events.length === 0) return;
    const element = document.getElementById(`event-${highlightEventId}`);
    if (!element) return;
    window.setTimeout(() => {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [highlightEventId, events]);

  async function addEvent() {
    const day = eventDay.trim();
    const dateLabel = day
      ? new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      : date.trim();

    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        date: dateLabel,
        time,
        location: location.trim() || "Shanah City",
        groupId,
        startsOn: day || startsOn || undefined,
        endsOn: day || endsOn || undefined,
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
      setEventDay("");
      setDate("");
      setTime("");
      setLocation("Shanah City");
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
      {canManage && !hideManualEventForm && (
        <Card className="mb-6">
          <h3 className="font-display text-lg font-semibold text-night-900">
            Manage {groupLabel} events
          </h3>
          <p className="mt-1 text-sm text-night-600">
            Group leaders and assistants can add events visible to all {groupLabel} members.
            Published worship rotations, rehearsals, and approved time away appear here automatically.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Title"
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <label className="text-sm text-night-700">
              <span className="font-semibold">Event date</span>
              <input
                type="date"
                value={eventDay}
                onChange={(event) => setEventDay(event.target.value)}
                className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
              />
            </label>
            <input
              value={time}
              onChange={(event) => setTime(event.target.value)}
              placeholder="Time (e.g. 7:00 PM)"
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
        items={calendarItems}
        emptyDayLabel={`No ${groupLabel.toLowerCase()} events on this day.`}
        worshipPlans={linkWorshipPlanner ? worshipPlans : undefined}
        canManageWorship={canManageWorship}
        containInParent={linkWorshipPlanner}
        renderItem={(event) => (
          <EventDetailCard
            event={event}
            canManage={canManage && !isGroupSyncedCalendarEventId(event.id)}
            onRemove={removeEvent}
            needsRsvp={!hideManualEventForm && pendingEventIds.has(event.id)}
            highlighted={Boolean(highlightEventId && event.id === highlightEventId)}
            simpleView={usesServiceSchedule}
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

export function UnavailabilitySection({
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

  const todayKey = denverTodayDateKey();
  const approved = activeApprovedAvailability(requests, todayKey);
  const current = approved.filter((item) => item.startDate <= todayKey);
  const upcoming = approved.filter((item) => item.startDate > todayKey);
  const availabilityLabel = group === "choir" ? "Choir availability" : "Pastor availability";

  function renderAbsence(item: UnavailabilityRequest) {
    const isCurrent = item.startDate <= todayKey;
    return (
      <li
        key={item.id}
        className="rounded-2xl border border-night-900/10 bg-white/90 px-4 py-4 shadow-sm dark:border-white/10 dark:bg-white/5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 break-words text-base font-semibold text-night-900 dark:text-sand-100">
            {item.personName}
          </p>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
              isCurrent
                ? "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100"
                : "bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-100"
            }`}
          >
            {isCurrent ? "Away now" : "Upcoming"}
          </span>
        </div>
        <p className="mt-2 text-sm font-medium leading-relaxed text-night-700 dark:text-sand-200">
          {formatDate(item.startDate)} – {formatDate(item.endDate)}
        </p>
        {item.reason?.trim() ? (
          <p className="mt-1 break-words text-sm leading-relaxed text-night-500 dark:text-sand-400">
            {item.reason}
          </p>
        ) : null}
      </li>
    );
  }

  return (
    <>
      <RequestForm group={group} signInNextUrl={signInNextUrl} onSubmitted={loadRequests} />
      <GroupAdminApproval
        requests={requests}
        canReview={canReview}
        onReviewed={loadRequests}
      />
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold text-night-900 dark:text-sand-100">
              {availabilityLabel}
            </h3>
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-night-600 dark:text-sand-300">
              Approved time away happening now or coming up. Past requests leave this view automatically.
            </p>
          </div>
          {approved.length > 0 ? (
            <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-night-700 dark:bg-white/10 dark:text-sand-200">
              {approved.length} active / upcoming
            </span>
          ) : null}
        </div>
        {approved.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-night-900/15 bg-sand-50/70 px-5 py-7 text-center dark:border-white/15 dark:bg-white/5">
            <p className="font-semibold text-night-800 dark:text-sand-100">Everyone is currently available</p>
            <p className="mt-1 text-sm text-night-500 dark:text-sand-400">
              No current or upcoming approved time-away requests.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {current.length > 0 ? (
              <section aria-label="Currently away">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-night-600 dark:text-sand-300">
                  Away now · {current.length}
                </h4>
                <ul className="grid gap-3 md:grid-cols-2">{current.map(renderAbsence)}</ul>
              </section>
            ) : null}
            {upcoming.length > 0 ? (
              <section aria-label="Upcoming time away">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-night-600 dark:text-sand-300">
                  Upcoming time away · {upcoming.length}
                </h4>
                <ul className="grid gap-3 md:grid-cols-2">{upcoming.map(renderAbsence)}</ul>
              </section>
            ) : null}
          </div>
        )}
      </Card>
    </>
  );
}

function worshipCalendarSinceIso() {
  const cursor = new Date();
  cursor.setMonth(cursor.getMonth() - 12);
  return cursor.toISOString().slice(0, 10);
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
  const { user } = useAuth();
  const [scheduleReload, setScheduleReload] = useState(0);
  const [worshipPlans, setWorshipPlans] = useState<WorshipServicePlan[]>([]);
  const [canManageWorship, setCanManageWorship] = useState(false);
  const isChoirGroup = groupId === CALENDAR_GROUP_TABS.choir;
  const usesServiceSchedule = groupHasServiceSchedule(groupId);
  const linkWorshipPlanner = showWorshipPlanner && isChoirGroup;
  const choirScheduleSplit = linkWorshipPlanner && usesServiceSchedule;

  useEffect(() => {
    if (!linkWorshipPlanner || !user) {
      setWorshipPlans([]);
      setCanManageWorship(false);
      return;
    }

    let cancelled = false;
    async function loadWorshipPlans() {
      const since = worshipCalendarSinceIso();
      const until = worshipPlanningUntilIso();
      const response = await fetch(
        `/api/worship?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`,
      );
      const data = await response.json();
      if (cancelled) return;
      if (response.ok) {
        setWorshipPlans(data.plans ?? []);
        setCanManageWorship(Boolean(data.canManage));
      } else {
        setWorshipPlans([]);
        setCanManageWorship(false);
      }
    }

    void loadWorshipPlans();
    return () => {
      cancelled = true;
    };
  }, [linkWorshipPlanner, user, scheduleReload]);

  return (
    <div className="mt-4">
      {showWorshipPlanner && isChoirGroup ? (
        <Card className="mb-6 bg-violet-50 ring-violet-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-night-900">
                Worship planner
              </h3>
              <p className="mt-1 text-sm text-night-600">
                Setlists, team readiness, and rehearsal notes for each service. Tap a gold-dot day on
                the calendar to jump straight to that service plan.
              </p>
            </div>
            <Button href="/worship?tab=schedule">Open planner</Button>
          </div>
        </Card>
      ) : null}

      {usesServiceSchedule ? (
        <GroupServiceSchedulePanel
          groupId={groupId}
          groupLabel={groupLabel}
          layout={choirScheduleSplit ? "editor" : "full"}
          worshipPlans={worshipPlans}
          canManageWorship={canManageWorship}
          onChanged={() => setScheduleReload((n) => n + 1)}
        />
      ) : null}

      <GroupEventsSection
        groupId={groupId}
        groupLabel={groupLabel}
        signInNextUrl={signInNextUrl}
        reloadKey={scheduleReload}
        worshipPlans={worshipPlans}
        canManageWorship={canManageWorship}
        linkWorshipPlanner={linkWorshipPlanner}
      />

      {choirScheduleSplit ? (
        <GroupServiceSchedulePanel
          groupId={groupId}
          groupLabel={groupLabel}
          layout="upcoming"
          worshipPlans={worshipPlans}
          canManageWorship={canManageWorship}
          onChanged={() => setScheduleReload((n) => n + 1)}
        />
      ) : null}

      {unavailabilityGroup ? (
        <div className="mt-6 space-y-6">
          <UnavailabilitySection group={unavailabilityGroup} signInNextUrl={signInNextUrl} />
        </div>
      ) : null}
    </div>
  );
}
