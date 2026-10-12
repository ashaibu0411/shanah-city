"use client";

import Image from "next/image";
import Link from "next/link";
import type { WorshipEventCardView } from "@/lib/choir-events-types";

type WorshipEventCardProps = {
  event: WorshipEventCardView;
  variant?: "compact" | "featured";
};

function registrationBadgeClass(status: WorshipEventCardView["registrationStatus"]) {
  if (status === "open") return "choir-we-reg-open";
  if (status === "registered") return "choir-we-reg-confirmed";
  if (status === "full" || status === "closed") return "choir-we-reg-muted";
  if (status === "canceled") return "choir-we-reg-muted";
  return "choir-we-reg-neutral";
}

export function WorshipEventCard({ event, variant = "compact" }: WorshipEventCardProps) {
  if (variant === "featured") {
    return (
      <article className="choir-we-featured-card">
        <div className="choir-we-featured-media">
          <Image src={event.imageUrl} alt="" fill className="object-cover" sizes="(max-width: 430px) 100vw, 480px" />
          <div className="choir-we-featured-gradient" />
        </div>
        <div className="choir-we-featured-body">
          <p className="choir-we-featured-kicker">{event.categoryLabel}</p>
          <h2 className="choir-we-featured-title">{event.title}</h2>
          <p className="choir-we-featured-meta">
            {event.dateKey ? `${event.weekdayLabel}, ${event.monthLabel} ${event.dayLabel}` : event.timeLabel} ·{" "}
            {event.timeLabel}
          </p>
          <p className="choir-we-featured-meta">{event.location}</p>
          <p className="choir-we-featured-audience">{event.audienceLabel}</p>
          <span className={`choir-we-reg-badge ${registrationBadgeClass(event.registrationStatus)}`}>
            {event.registrationLabel}
          </span>
          <p className="choir-we-featured-desc">{event.shortDescription}</p>
          <div className="choir-we-featured-actions">
            <Link href={event.detailHref} className="choir-btn-primary min-h-[44px] flex-1 text-center">
              View Details
            </Link>
            {event.rsvpEnabled && event.registrationStatus === "open" ? (
              <Link href={`${event.detailHref}?register=1`} className="choir-btn-secondary min-h-[44px] flex-1 text-center">
                Register Now
              </Link>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <Link href={event.detailHref} className="choir-we-list-card">
      <div className="choir-we-list-date">
        <span className="choir-we-list-month">{event.monthLabel}</span>
        <span className="choir-we-list-day">{event.dayLabel}</span>
        <span className="choir-we-list-weekday">{event.weekdayLabel}</span>
      </div>
      <div className="choir-we-list-thumb">
        <Image src={event.imageUrl} alt="" fill className="object-cover" sizes="72px" />
      </div>
      <div className="choir-we-list-copy">
        <p className="choir-we-list-title">{event.title}</p>
        <p className="choir-we-list-meta">
          {event.timeLabel} · {event.location}
        </p>
        <p className="choir-we-list-meta">{event.audienceLabel}</p>
        <span className={`choir-we-reg-badge ${registrationBadgeClass(event.registrationStatus)}`}>
          {event.registrationLabel}
        </span>
      </div>
      <span className="choir-we-list-chevron" aria-hidden>
        ›
      </span>
    </Link>
  );
}
