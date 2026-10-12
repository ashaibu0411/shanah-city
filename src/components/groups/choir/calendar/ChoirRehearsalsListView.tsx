"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChoirEventCard } from "@/components/groups/choir/calendar/ChoirEventCard";
import type { ChoirCalendarEvent, ChoirCalendarPagePayload } from "@/lib/choir-calendar-types";
import { filterRehearsalEvents } from "@/lib/choir-calendar-links";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { getZonedDateParts } from "@/lib/denver-time";

type RehearsalRange = "upcoming" | "month" | "future";

type ChoirRehearsalsListViewProps = {
  groupId: string;
  events: ChoirCalendarEvent[];
  payload: ChoirCalendarPagePayload;
  onSelectEvent: (event: ChoirCalendarEvent) => void;
};

export function ChoirRehearsalsListView({
  groupId,
  events,
  payload,
  onSelectEvent,
}: ChoirRehearsalsListViewProps) {
  const [range, setRange] = useState<RehearsalRange>("upcoming");
  const nowMs = Date.now();
  const today = getZonedDateParts();

  const rehearsals = useMemo(() => filterRehearsalEvents(events), [events]);

  const filtered = useMemo(() => {
    const monthPrefix = `${today.year}-${String(today.month).padStart(2, "0")}`;
    return rehearsals.filter((event) => {
      const isFuture = event.startsAtMs >= nowMs - 3_600_000;
      if (!isFuture) return false;
      if (range === "month") return event.dateKey.startsWith(monthPrefix);
      if (range === "upcoming") {
        const horizon = nowMs + 45 * 86_400_000;
        return event.startsAtMs <= horizon;
      }
      return true;
    });
  }, [rehearsals, range, nowMs, today.year, today.month]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-[var(--choir-heading)]">Upcoming Rehearsals</h2>
        <p className="mt-1 text-sm text-[var(--choir-muted)]">
          Stay prepared for our upcoming worship team rehearsals.
        </p>
      </div>

      <div className="choir-calendar-filter-row">
        {(
          [
            { id: "upcoming" as const, label: "Upcoming" },
            { id: "month" as const, label: "This month" },
            { id: "future" as const, label: "All future" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            className={`choir-calendar-filter ${range === item.id ? "is-active" : ""}`}
            onClick={() => setRange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="choir-card p-5 text-center">
          <p className="font-display text-lg font-bold text-[var(--choir-heading)]">No Upcoming Rehearsals</p>
          <p className="mt-2 text-sm text-[var(--choir-muted)]">
            No upcoming rehearsals are currently scheduled.
          </p>
          <Link
            href={`/groups/${encodeURIComponent(groupId)}/calendar`}
            className="choir-btn-primary mt-4 inline-flex min-h-[44px] items-center justify-center px-4"
          >
            View Worship Calendar
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((event) => (
            <li key={event.id}>
              <ChoirEventCard event={event} onSelect={() => onSelectEvent(event)} />
            </li>
          ))}
        </ul>
      )}

      {payload.canManageSchedule ? (
        <Link href={payload.manageScheduleHref} className="choir-setlist-manage-link block text-center">
          Manage schedule on Events tab →
        </Link>
      ) : null}

      {payload.canManageWorship ? (
        <Link href={payload.managePlannerHref} className="choir-setlist-manage-link block text-center">
          Worship planner →
        </Link>
      ) : null}

      <Link
        href={`/groups/${SHANAH_WORSHIP_GROUP_ID}/calendar`}
        className="choir-setlist-manage-link block text-center"
      >
        Full worship calendar →
      </Link>
    </div>
  );
}
