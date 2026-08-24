"use client";

import Link from "next/link";
import { useMyEventRsvps } from "@/components/calendar/useMyEventRsvps";
import { Card } from "@/components/ui";
import { eventRsvpStatusLabel } from "@/lib/event-rsvp-types";
import { formatRsvpDeadlineLabel } from "@/lib/event-rsvp-utils";

export function MemberEventRsvps() {
  const { pending, responded, loading } = useMyEventRsvps(true);

  if (loading) {
    return (
      <Card>
        <h2 className="font-display text-lg font-semibold text-night-900">My RSVPs</h2>
        <p className="mt-2 text-sm text-night-500">Loading…</p>
      </Card>
    );
  }

  if (pending.length === 0 && responded.length === 0) {
    return (
      <Card>
        <h2 className="font-display text-lg font-semibold text-night-900">My RSVPs</h2>
        <p className="mt-2 text-sm text-night-600">
          When leaders request RSVPs for special events, they&apos;ll show up here.
        </p>
        <Link href="/calendar" className="mt-3 inline-block text-sm font-semibold text-night-800 hover:underline">
          Open calendar →
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-night-900">My RSVPs</h2>
        {pending.length > 0 ? (
          <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-900">
            {pending.length} needed
          </span>
        ) : null}
      </div>

      {pending.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-night-500">Needs your reply</p>
          <ul className="mt-2 space-y-2">
            {pending.map((item) => (
              <li key={item.eventId}>
                <Link
                  href={`/calendar?event=${encodeURIComponent(item.eventId)}`}
                  className="block rounded-xl bg-teal-50 px-3 py-2.5 ring-1 ring-teal-100 transition hover:bg-teal-100/80"
                >
                  <p className="font-semibold text-night-900">{item.title}</p>
                  <p className="mt-1 text-sm text-night-600">
                    {item.date} · {item.time}
                  </p>
                  {item.deadline ? (
                    <p className="mt-1 text-xs font-medium text-teal-800">
                      RSVP by {formatRsvpDeadlineLabel(item.deadline)}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {responded.length > 0 ? (
        <div className={pending.length > 0 ? "mt-5" : "mt-4"}>
          <p className="text-xs font-bold uppercase tracking-wide text-night-500">Your responses</p>
          <ul className="mt-2 space-y-2">
            {responded.slice(0, 6).map((item) => (
              <li key={item.eventId}>
                <Link
                  href={`/calendar?event=${encodeURIComponent(item.eventId)}`}
                  className="block rounded-xl bg-sand-50 px-3 py-2.5 ring-1 ring-night-900/5 transition hover:bg-sand-100"
                >
                  <p className="font-semibold text-night-900">{item.title}</p>
                  <p className="mt-1 text-sm text-night-600">
                    {item.myStatus ? eventRsvpStatusLabel(item.myStatus) : "Responded"} · {item.date}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
