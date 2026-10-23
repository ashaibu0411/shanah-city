"use client";

import Link from "next/link";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { eventArtworkUrl } from "@/lib/home-premium";
import type { HomeUpcomingEventRow } from "@/lib/home-upcoming-events";
import { formatHomeEventMeta } from "@/lib/home-upcoming-events";
import { ChevronRightIcon } from "@/components/home/premium/PremiumHomeIcons";

type PremiumUpcomingEventsProps = {
  rows: HomeUpcomingEventRow[];
  variant?: "desktop" | "mobile";
};

export function PremiumUpcomingEvents({ rows, variant = "desktop" }: PremiumUpcomingEventsProps) {
  if (rows.length === 0) return null;

  const mobile = variant === "mobile";

  return (
    <section className="premium-section" aria-labelledby="premium-events-heading">
      <div className="premium-section__head">
        <h2 id="premium-events-heading" className="premium-section__title">
          Upcoming Events
        </h2>
        <Link href="/calendar" className="premium-section__link">
          View all →
        </Link>
      </div>

      {mobile ? (
        <ul className="premium-events-mobile">
          {rows.map(({ event, occurrenceDate }) => {
            const { day, meta } = formatHomeEventMeta(event, occurrenceDate);
            const month = day?.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
            const dayNum = day?.getDate();
            const image = eventArtworkUrl(event);

            return (
              <li key={`${event.id}-${occurrenceDate}`}>
                <Link href="/calendar" className="premium-event-card premium-event-card--mobile">
                  <div className="premium-event-card__media">
                    <ChurchFlyerImage src={image} alt="" sizes="100vw" className="h-full w-full object-cover" />
                    <div className="premium-event-card__scrim" aria-hidden />
                    <div className="premium-event-card__date">
                      <span className="premium-event-card__month">{month ?? "—"}</span>
                      <span className="premium-event-card__day">{dayNum ?? "·"}</span>
                    </div>
                  </div>
                  <div className="premium-event-card__body">
                    <p className="premium-event-card__title">{event.title}</p>
                    <p className="premium-event-card__meta">{meta}</p>
                    {event.location?.trim() ? (
                      <p className="premium-event-card__location">{event.location}</p>
                    ) : null}
                  </div>
                  <span className="premium-event-card__arrow" aria-hidden>
                    <ChevronRightIcon />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="premium-events-desktop">
          {rows.map(({ event, occurrenceDate }) => {
            const { day, meta } = formatHomeEventMeta(event, occurrenceDate);
            const month = day?.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
            const dayNum = day?.getDate();
            const image = eventArtworkUrl(event);

            return (
              <Link
                key={`${event.id}-${occurrenceDate}`}
                href="/calendar"
                className="premium-event-card premium-event-card--desktop"
              >
                <div className="premium-event-card__media">
                  <ChurchFlyerImage src={image} alt="" sizes="(max-width:1280px) 33vw, 360px" className="h-full w-full object-cover" />
                  <div className="premium-event-card__scrim" aria-hidden />
                  <div className="premium-event-card__date">
                    <span className="premium-event-card__month">{month ?? "—"}</span>
                    <span className="premium-event-card__day">{dayNum ?? "·"}</span>
                  </div>
                </div>
                <div className="premium-event-card__footer">
                  <p className="premium-event-card__title">{event.title}</p>
                  <p className="premium-event-card__meta">{meta}</p>
                  {event.location?.trim() ? (
                    <p className="premium-event-card__location">{event.location}</p>
                  ) : null}
                  <span className="premium-btn premium-btn--secondary premium-btn--sm">
                    {event.rsvpEnabled ? "I'm Going" : "Learn More"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
