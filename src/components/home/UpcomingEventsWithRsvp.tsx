"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { EventRsvpBadge } from "@/components/calendar/EventRsvpBadge";
import { useMyEventRsvps } from "@/components/calendar/useMyEventRsvps";
import type { ChurchEvent } from "@/lib/types";

export function UpcomingEventsWithRsvp({ events }: { events: ChurchEvent[] }) {
  const { user } = useAuth();
  const { pendingEventIds } = useMyEventRsvps(Boolean(user));

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {events.map((event) => (
        <Link
          key={event.id}
          href={`/calendar?event=${encodeURIComponent(event.id)}`}
          className="block rounded-2xl bg-white p-4 ring-1 ring-night-900/5 transition hover:bg-sand-50"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-sand-600">{event.date}</p>
            {pendingEventIds.has(event.id) ? <EventRsvpBadge compact /> : null}
          </div>
          <h3 className="mt-1 font-display text-lg font-semibold text-night-900">{event.title}</h3>
          <p className="mt-2 text-sm text-night-600">
            {event.time} · {event.location}
          </p>
        </Link>
      ))}
    </div>
  );
}
