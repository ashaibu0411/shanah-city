"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChoirSetlistHeader } from "@/components/groups/choir/setlist/ChoirSetlistHeader";
import { ChoirCalendarTabs, type ChoirCalendarTabId } from "@/components/groups/choir/calendar/ChoirCalendarTabs";
import { ChoirEventCard } from "@/components/groups/choir/calendar/ChoirEventCard";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import type {
  ChoirCalendarEvent,
  ChoirCalendarEventCategory,
  ChoirCalendarPagePayload,
} from "@/lib/choir-calendar-types";
import { buildIcsEventFile, downloadIcsFile } from "@/lib/calendar-ics-export";
import { getZonedDateParts } from "@/lib/denver-time";
import { worshipPlannerPath } from "@/lib/worship-plan-links";
import { choirAvailabilityHref, choirMyScheduleHref } from "@/lib/choir-availability-links";
import { choirWorshipEventsHref } from "@/lib/choir-events-links";
import {
  categoryFilterToParam,
  parseCalendarCategoryFilter,
  parseCalendarDisplayMode,
  type ChoirCalendarCategoryFilter,
  type ChoirCalendarDisplayMode,
} from "@/lib/choir-calendar-url";
import { ChoirRehearsalsListView } from "@/components/groups/choir/calendar/ChoirRehearsalsListView";
import "../choir-premium.css";

const LEGEND: { category: ChoirCalendarEventCategory; label: string }[] = [
  { category: "service", label: "Service" },
  { category: "rehearsal", label: "Rehearsal" },
  { category: "event", label: "Event" },
  { category: "time-away", label: "Time away" },
  { category: "other", label: "Other" },
];

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function parseTab(value: string | null, filter: string | null): ChoirCalendarTabId {
  if (filter === "rehearsals" || value === "rehearsals") return "rehearsals";
  if (value === "my" || value === "team" || value === "list") return value;
  return "calendar";
}

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function statusLabel(event: ChoirCalendarEvent) {
  if (!event.personalStatus) return null;
  if (event.personalStatus === "confirmed") return "Confirmed";
  if (event.personalStatus === "response_needed") return "Response needed";
  return "Assigned";
}

type ChoirWorshipCalendarPageProps = {
  groupId: string;
  initialPayload?: ChoirCalendarPagePayload | null;
  initialError?: string | null;
};

export function ChoirWorshipCalendarPage({
  groupId,
  initialPayload = null,
  initialError = null,
}: ChoirWorshipCalendarPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<ChoirCalendarTabId>(() =>
    parseTab(searchParams.get("tab"), searchParams.get("filter")),
  );
  const [payload, setPayload] = useState<ChoirCalendarPagePayload | null>(initialPayload);
  const [loading, setLoading] = useState(!initialPayload && !initialError);
  const [error, setError] = useState<string | null>(initialError);

  const denverToday = getZonedDateParts();
  const [monthCursor, setMonthCursor] = useState(() => ({
    year: Number(denverToday.year),
    month: Number(denverToday.month) - 1,
  }));

  const [selectedDateKey, setSelectedDateKey] = useState(denverToday.dateKey);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(searchParams.get("event"));
  const [categoryFilter, setCategoryFilter] = useState<ChoirCalendarCategoryFilter>(() =>
    parseCalendarCategoryFilter(searchParams.get("filter"), searchParams.get("tab")),
  );
  const [displayMode, setDisplayMode] = useState<ChoirCalendarDisplayMode>(() =>
    parseCalendarDisplayMode(searchParams.get("display")),
  );
  const [listMode, setListMode] = useState<"upcoming" | "past">("upcoming");

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/groups/choir-calendar?groupId=${encodeURIComponent(groupId)}`, { credentials: "include" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.payload) {
          setError(data.error ?? "Unable to load the worship calendar.");
          setPayload(null);
        } else {
          setPayload(data.payload);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load the worship calendar.");
        setLoading(false);
      });
  }, [groupId]);

  useEffect(() => {
    if (initialPayload || initialError) return;
    load();
  }, [load, initialPayload, initialError]);

  useEffect(() => {
    if (searchParams.get("tab") === "my") {
      router.replace(`/groups/${encodeURIComponent(groupId)}/my-schedule`);
      return;
    }
    const nextTab = parseTab(searchParams.get("tab"), searchParams.get("filter"));
    setTab(nextTab);
    setCategoryFilter(parseCalendarCategoryFilter(searchParams.get("filter"), searchParams.get("tab")));
    setDisplayMode(parseCalendarDisplayMode(searchParams.get("display")));
    const event = searchParams.get("event");
    if (event) setSelectedEventId(event);
    const date = searchParams.get("date");
    if (date?.trim()) setSelectedDateKey(date.trim());
  }, [searchParams, groupId, router]);

  const events = payload?.events ?? [];
  const nowMs = Date.now();

  const filteredEvents = useMemo(() => {
    if (categoryFilter === "all") return events;
    if (categoryFilter === "mine") {
      return events.filter((event) => Boolean(event.personalRoleLabel));
    }
    return events.filter((event) => event.category === categoryFilter);
  }, [events, categoryFilter]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Set<ChoirCalendarEventCategory>>();
    for (const event of filteredEvents) {
      const set = map.get(event.dateKey) ?? new Set();
      set.add(event.category);
      map.set(event.dateKey, set);
    }
    return map;
  }, [filteredEvents]);

  const selectedDayEvents = useMemo(
    () => filteredEvents.filter((event) => event.dateKey === selectedDateKey).sort((a, b) => a.startsAtMs - b.startsAtMs),
    [filteredEvents, selectedDateKey],
  );

  const upcomingFive = useMemo(
    () => filteredEvents.filter((event) => event.startsAtMs >= nowMs - 3_600_000).slice(0, 5),
    [filteredEvents, nowMs],
  );

  const agendaEvents = useMemo(
    () =>
      [...filteredEvents]
        .filter((event) => event.startsAtMs >= nowMs - 3_600_000)
        .sort((a, b) => a.startsAtMs - b.startsAtMs),
    [filteredEvents, nowMs],
  );

  const listEvents = useMemo(() => {
    const sorted = [...filteredEvents].sort((a, b) => a.startsAtMs - b.startsAtMs);
    if (listMode === "upcoming") {
      return sorted.filter((event) => event.startsAtMs >= nowMs - 86_400_000);
    }
    return sorted.filter((event) => event.startsAtMs < nowMs).reverse();
  }, [filteredEvents, listMode, nowMs]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  function replaceCalendarParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function changeTab(next: ChoirCalendarTabId) {
    if (next === "my") {
      router.push(`/groups/${encodeURIComponent(groupId)}/my-schedule`);
      return;
    }
    setTab(next);
    replaceCalendarParams((params) => {
      params.set("tab", next);
      if (next === "rehearsals") {
        params.set("filter", "rehearsals");
      } else if (next === "calendar") {
        params.delete("tab");
      } else {
        params.delete("filter");
      }
    });
  }

  function changeCategoryFilter(next: ChoirCalendarCategoryFilter) {
    setCategoryFilter(next);
    replaceCalendarParams((params) => {
      params.set("tab", "calendar");
      const param = categoryFilterToParam(next);
      if (param) params.set("filter", param);
      else params.delete("filter");
    });
  }

  function changeDisplayMode(next: ChoirCalendarDisplayMode) {
    setDisplayMode(next);
    replaceCalendarParams((params) => {
      if (next === "agenda") params.set("display", "agenda");
      else params.delete("display");
    });
  }

  function goToToday() {
    setMonthCursor({ year: Number(denverToday.year), month: Number(denverToday.month) - 1 });
    setSelectedDateKey(denverToday.dateKey);
    replaceCalendarParams((params) => {
      params.set("date", denverToday.dateKey);
    });
  }

  function selectDate(dateKey: string) {
    setSelectedDateKey(dateKey);
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", dateKey);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function openEvent(event: ChoirCalendarEvent) {
    setSelectedEventId(event.id);
    setSelectedDateKey(event.dateKey);
    const params = new URLSearchParams(searchParams.toString());
    params.set("event", event.id);
    params.set("date", event.dateKey);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function closeEventSheet() {
    setSelectedEventId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("event");
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function exportEventToCalendar(event: ChoirCalendarEvent) {
    const time24 = event.serviceTime?.trim() || "10:00";
    const ics = buildIcsEventFile({
      uid: event.id,
      title: event.title,
      dateKey: event.dateKey,
      time24,
      location: event.location,
      description: event.description,
      durationMinutes: event.category === "rehearsal" ? 120 : 90,
    });
    downloadIcsFile(`${event.title.replace(/\s+/g, "-")}.ics`, ics);
  }

  const grid = useMemo(() => {
    const { year, month } = monthCursor;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const cells: { dateKey: string; inMonth: boolean; day: number }[] = [];

    for (let i = firstDay - 1; i >= 0; i -= 1) {
      const day = daysInPrev - i;
      const date = new Date(year, month - 1, day);
      cells.push({
        dateKey: toDateKey(date),
        inMonth: false,
        day,
      });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({
        dateKey: toDateKey(new Date(year, month, day)),
        inMonth: true,
        day,
      });
    }
    while (cells.length % 7 !== 0) {
      const nextDay = cells.length - (firstDay + daysInMonth) + 1;
      const date = new Date(year, month + 1, nextDay);
      cells.push({ dateKey: toDateKey(date), inMonth: false, day: date.getDate() });
    }
    return cells;
  }, [monthCursor]);

  if (loading) {
    return (
      <div className="choir-group-home choir-calendar-page px-4 py-3">
        <p className="text-sm text-[var(--choir-muted)]">Loading worship calendar…</p>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="choir-group-home choir-calendar-page px-4 py-3">
        <p className="text-sm text-red-700">{error ?? "Unavailable."}</p>
        <button type="button" className="choir-setlist-manage-link mt-3" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="choir-group-home choir-calendar-page choir-page-shell space-y-[18px] pb-10">
      <ChoirSetlistHeader groupId={groupId} chatHref={payload.groupChatHref} />

      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--choir-heading)]">Worship calendar</h1>
        <p className="mt-1 text-sm text-[var(--choir-muted)]">Services, rehearsals, and team events.</p>
      </div>

      <ChoirCalendarTabs active={tab} onChange={changeTab} />

      {tab === "calendar" ? (
        <div className="choir-calendar-main space-y-4">
          <section className="choir-calendar-month-card" aria-label="Monthly calendar">
            <div className="choir-calendar-month-header">
              <button
                type="button"
                className="choir-calendar-month-nav"
                aria-label="Previous month"
                onClick={() => setMonthCursor((cursor) => shiftMonth(cursor.year, cursor.month, -1))}
              >
                ‹
              </button>
              <h2 className="choir-calendar-month-title">{monthLabel(monthCursor.year, monthCursor.month)}</h2>
              <button
                type="button"
                className="choir-calendar-month-nav"
                aria-label="Next month"
                onClick={() => setMonthCursor((cursor) => shiftMonth(cursor.year, cursor.month, 1))}
              >
                ›
              </button>
            </div>
            <button type="button" className="choir-calendar-today-btn" onClick={goToToday}>
              Today
            </button>

            {displayMode === "month" ? (
              <>
                <div className="choir-calendar-weekdays">
                  {WEEKDAYS.map((label, index) => (
                    <span key={`${label}-${index}`} className="choir-calendar-weekday">
                      {label}
                    </span>
                  ))}
                </div>
                <div className="choir-calendar-grid">
                  {grid.map((cell) => {
                    const markers = eventsByDate.get(cell.dateKey);
                    const isSelected = cell.dateKey === selectedDateKey;
                    const isToday = cell.dateKey === denverToday.dateKey;
                    return (
                      <button
                        key={`${cell.dateKey}-${cell.inMonth}`}
                        type="button"
                        className={`choir-calendar-cell ${isSelected ? "is-selected" : ""} ${isToday ? "is-today" : ""} ${cell.inMonth ? "" : "is-outside"}`}
                        onClick={() => selectDate(cell.dateKey)}
                        aria-label={cell.dateKey}
                      >
                        <span className="choir-calendar-cell-num">{cell.day}</span>
                        {markers && markers.size > 0 ? (
                          <span className="choir-calendar-dots" aria-hidden>
                            {[...markers].slice(0, 3).map((category) => (
                              <span key={category} className={`choir-calendar-dot choir-calendar-dot-${category}`} />
                            ))}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <div className="choir-calendar-legend">
                  {LEGEND.map((entry) => (
                    <span key={entry.category} className="choir-calendar-legend-item">
                      <span className={`choir-calendar-dot choir-calendar-dot-${entry.category}`} aria-hidden />
                      {entry.label}
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </section>

          <div className="choir-calendar-view-row" role="tablist" aria-label="Calendar display">
            <button
              type="button"
              role="tab"
              aria-selected={displayMode === "month"}
              className={`choir-calendar-view-btn ${displayMode === "month" ? "is-active" : ""}`}
              onClick={() => changeDisplayMode("month")}
            >
              Month
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={displayMode === "agenda"}
              className={`choir-calendar-view-btn ${displayMode === "agenda" ? "is-active" : ""}`}
              onClick={() => changeDisplayMode("agenda")}
            >
              Agenda
            </button>
          </div>

          {displayMode === "agenda" ? (
            <section aria-label="Agenda">
              {agendaEvents.length === 0 ? (
                <p className="text-sm text-[var(--choir-muted)]">No upcoming events match this filter.</p>
              ) : (
                <ul className="space-y-2">
                  {agendaEvents.map((event) => (
                    <li key={event.id}>
                      <ChoirEventCard event={event} onSelect={() => openEvent(event)} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            <section aria-labelledby="choir-selected-day">
              <h2 id="choir-selected-day" className="choir-section-heading text-base">
                {new Date(`${selectedDateKey}T12:00:00`).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
              {selectedDayEvents.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--choir-muted)]">No events scheduled for this date.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {selectedDayEvents.map((event) => (
                    <li key={event.id}>
                      <ChoirEventCard
                        event={event}
                        selected={selectedEventId === event.id}
                        onSelect={() => openEvent(event)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section aria-labelledby="choir-upcoming-schedule">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 id="choir-upcoming-schedule" className="choir-section-heading text-base">
                Upcoming events
              </h2>
              <button type="button" className="text-xs font-bold text-[var(--choir-gold-dark)]" onClick={() => changeTab("list")}>
                See all
              </button>
            </div>
            {upcomingFive.length === 0 ? (
              <p className="text-sm text-[var(--choir-muted)]">No upcoming events published yet.</p>
            ) : (
              <ul className="space-y-2">
                {upcomingFive.map((event) => (
                  <li key={event.id}>
                    <ChoirEventCard event={event} onSelect={() => openEvent(event)} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="choir-calendar-filter-row" role="group" aria-label="Event filters">
            {(
              [
                { id: "all" as const, label: "All Events" },
                { id: "service" as const, label: "Services" },
                { id: "rehearsal" as const, label: "Rehearsals" },
                { id: "event" as const, label: "Special Events" },
                { id: "mine" as const, label: "My Assignments" },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`choir-calendar-filter ${categoryFilter === filter.id ? "is-active" : ""}`}
                onClick={() => changeCategoryFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "rehearsals" ? (
        <ChoirRehearsalsListView
          groupId={groupId}
          events={events}
          payload={payload}
          onSelectEvent={openEvent}
        />
      ) : null}

      {tab === "team" ? (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">Team schedule</h2>
            <p className="mt-1 text-sm text-[var(--choir-muted)]">
              See when the worship team is serving and rehearsing.
            </p>
          </div>
          {filteredEvents.length === 0 ? (
            <p className="text-sm text-[var(--choir-muted)]">No published team events yet.</p>
          ) : (
            <ul className="space-y-2">
              {filteredEvents
                .filter((event) => event.startsAtMs >= nowMs - 86_400_000)
                .map((event) => (
                  <li key={event.id}>
                    <ChoirEventCard event={event} onSelect={() => openEvent(event)} />
                  </li>
                ))}
            </ul>
          )}
          {payload.canManageSchedule ? (
            <Link href={payload.manageScheduleHref} className="choir-setlist-manage-link block text-center">
              Manage schedule →
            </Link>
          ) : null}
        </div>
      ) : null}

      {tab === "list" ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              className={`choir-calendar-filter ${listMode === "upcoming" ? "is-active" : ""}`}
              onClick={() => setListMode("upcoming")}
            >
              Upcoming
            </button>
            <button
              type="button"
              className={`choir-calendar-filter ${listMode === "past" ? "is-active" : ""}`}
              onClick={() => setListMode("past")}
            >
              Past
            </button>
          </div>
          {listEvents.length === 0 ? (
            <p className="text-sm text-[var(--choir-muted)]">No events found. Try another range or category.</p>
          ) : (
            <ul className="space-y-2">
              {listEvents.map((event) => (
                <li key={event.id}>
                  <ChoirEventCard event={event} onSelect={() => openEvent(event)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <button
        type="button"
        className="choir-calendar-add-btn"
        onClick={() => {
          const target = selectedEvent ?? upcomingFive[0] ?? events[0];
          if (!target) return;
          exportEventToCalendar(target);
        }}
        disabled={events.length === 0}
      >
        <span aria-hidden>+</span> Add to calendar
      </button>

      {payload.canManageWorship ? (
        <Link href={payload.managePlannerHref} className="choir-setlist-manage-link block text-center">
          Manage worship plans →
        </Link>
      ) : null}

      {selectedEvent ? (
        <EventDetailSheet
          groupId={groupId}
          event={selectedEvent}
          canManageWorship={payload.canManageWorship}
          onClose={closeEventSheet}
          onAddToCalendar={() => exportEventToCalendar(selectedEvent)}
        />
      ) : null}
    </div>
  );
}

function EventDetailSheet({
  groupId,
  event,
  canManageWorship,
  onClose,
  onAddToCalendar,
}: {
  groupId: string;
  event: ChoirCalendarEvent;
  canManageWorship: boolean;
  onClose: () => void;
  onAddToCalendar: () => void;
}) {
  const setlistHref =
    event.serviceDate && event.serviceTime
      ? `/groups/${SHANAH_WORSHIP_GROUP_ID}/setlists?date=${encodeURIComponent(event.serviceDate)}&time=${encodeURIComponent(event.serviceTime)}`
      : null;
  const rehearsalHref =
    event.serviceDate && event.serviceTime
      ? `/groups/${SHANAH_WORSHIP_GROUP_ID}/rehearsal?date=${encodeURIComponent(event.serviceDate)}&time=${encodeURIComponent(event.serviceTime)}`
      : `/groups/${SHANAH_WORSHIP_GROUP_ID}/rehearsal`;

  return (
    <div className="choir-setlist-sheet-backdrop" role="presentation" onClick={onClose}>
      <div className="choir-setlist-sheet" role="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">{event.title}</h2>
            <p className="mt-1 text-sm text-[var(--choir-muted)]">
              {event.timeLabel} · {event.location}
            </p>
          </div>
          <button type="button" className="choir-header-icon-btn !h-10 !w-10" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {event.description ? (
          <p className="mt-3 text-sm text-[var(--choir-body)] whitespace-pre-wrap">{event.description}</p>
        ) : null}
        <p className="mt-2 text-sm">
          <span className="font-semibold">Type:</span>{" "}
          {event.category === "service"
            ? "Worship service"
            : event.category === "rehearsal"
              ? "Rehearsal"
              : event.category === "event"
                ? "Special event"
                : event.category === "time-away"
                  ? "Member time away"
                  : "Ministry activity"}
        </p>
        {event.teamLabel ? (
          <p className="text-sm">
            <span className="font-semibold">Team:</span> {event.teamLabel}
          </p>
        ) : null}
        {event.personalRoleLabel ? (
          <p className="mt-2 text-sm">
            <span className="font-semibold">Your role:</span> {event.personalRoleLabel}
            {statusLabel(event) ? ` · ${statusLabel(event)}` : ""}
          </p>
        ) : null}
        <div className="mt-4 flex flex-col gap-2">
          {setlistHref && event.category === "service" ? (
            <Link href={setlistHref} className="choir-btn-primary text-center">
              View setlist
            </Link>
          ) : null}
          <Link href={rehearsalHref} className="choir-btn-secondary text-center">
            Open rehearsal room
          </Link>
          <Link href={choirMyScheduleHref(groupId)} className="choir-btn-secondary text-center">
            My Schedule
          </Link>
          <Link href={choirAvailabilityHref(groupId)} className="choir-btn-secondary text-center">
            Availability Center
          </Link>
          <Link href={choirWorshipEventsHref(groupId)} className="choir-btn-secondary text-center">
            Worship Events
          </Link>
          <button type="button" className="choir-btn-secondary" onClick={onAddToCalendar}>
            Add to device calendar
          </button>
          {canManageWorship && event.serviceDate && event.serviceTime ? (
            <Link
              href={worshipPlannerPath({ serviceDate: event.serviceDate, serviceTime: event.serviceTime })}
              className="choir-setlist-manage-link text-center"
            >
              Worship planner
            </Link>
          ) : null}
          {event.sourceType === "group-event" ? (
            <Link href={event.detailHref} className="choir-setlist-manage-link text-center">
              Full event details
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftMonth(year: number, month: number, delta: number) {
  const next = new Date(year, month + delta, 1);
  return { year: next.getFullYear(), month: next.getMonth() };
}
