"use client";

import Link from "next/link";
import type { HomeUpcomingEventRow } from "@/lib/home-upcoming-events";
import { formatHomeEventMeta } from "@/lib/home-upcoming-events";
import { PremiumHomeV4Chevron } from "@/components/home/premium/v4/PremiumHomeV4Icons";

type PremiumHomeV4UpcomingEventsProps = {
  rows: HomeUpcomingEventRow[];
};

export function PremiumHomeV4UpcomingEvents({ rows }: PremiumHomeV4UpcomingEventsProps) {
  if (rows.length === 0) return null;

  return (
    <section className="ph4-section" aria-labelledby="ph4-events-heading">
      <div className="ph4-section__head">
        <h2 id="ph4-events-heading" className="ph4-section__title">
          Upcoming Events
        </h2>
        <Link href="/calendar" className="ph4-section__link">
          View all →
        </Link>
      </div>
      <ul className="ph4-events">
        {rows.map(({ event, occurrenceDate }) => {
          const { day, meta } = formatHomeEventMeta(event, occurrenceDate);
          const month = day?.toLocaleDateString(undefined, { month: "short" }).toUpperCase() ?? "—";
          const dayNum = day?.getDate() ?? "·";

          return (
            <li key={`${event.id}-${occurrenceDate}`}>
              <Link href="/calendar" className="ph4-event-row">
                <span className="ph4-event-row__date">
                  <span className="ph4-event-row__month">{month}</span>
                  <span className="ph4-event-row__day">{dayNum}</span>
                </span>
                <span className="ph4-event-row__body">
                  <span className="ph4-event-row__title">{event.title}</span>
                  <span className="ph4-event-row__meta">{meta}</span>
                  {event.location?.trim() ? (
                    <span className="ph4-event-row__location">{event.location}</span>
                  ) : null}
                </span>
                <span className="ph4-event-row__chevron">
                  <PremiumHomeV4Chevron />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
