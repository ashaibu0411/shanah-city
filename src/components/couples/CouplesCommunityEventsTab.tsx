"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { EventRsvpPanel } from "@/components/calendar/EventRsvpPanel";
import { CouplesLoadingSkeleton, CouplesPrimaryButton } from "@/components/couples/design-system";
import { SHANAH_POWER_COUPLES_GROUP_ID } from "@/lib/church-groups";
import { eventImageUrl, formatCouplesEventDate, parseCouplesEventDay } from "@/lib/couple-community-ui";
import type { ChurchEvent } from "@/lib/types";

function CouplesEventCard({
  event,
  onRsvp,
}: {
  event: ChurchEvent;
  onRsvp: () => void;
}) {
  const image = eventImageUrl(event);
  const dateLabel = formatCouplesEventDate(event);
  const location = event.location?.trim() || "Location TBA";

  return (
    <article className="overflow-hidden rounded-[1.125rem] bg-white shadow-sm ring-1 ring-[var(--couples-border)]">
      <div className="relative h-40 w-full bg-gradient-to-br from-[#3d1f4a]/20 to-[var(--couples-gold-light)]/40">
        {image ? (
          <Image src={image} alt="" fill className="object-cover" sizes="(max-width: 480px) 100vw, 480px" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--couples-midnight)]/55 to-transparent" />
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-gold)]">
          {dateLabel}
          {event.time ? ` · ${event.time}` : ""}
        </p>
        <h3 className="mt-1 font-[family-name:var(--font-couples-display)] text-lg font-semibold text-[var(--couples-text)]">
          {event.title}
        </h3>
        <p className="mt-1 text-sm text-[var(--couples-muted)]">{location}</p>
        <CouplesPrimaryButton className="mt-4" onClick={onRsvp}>
          {event.rsvpEnabled ? "RSVP" : "View details"}
        </CouplesPrimaryButton>
      </div>
    </article>
  );
}

export function CouplesCommunityEventsTab() {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpEvent, setRsvpEvent] = useState<ChurchEvent | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    void fetch(`/api/events?groupId=${encodeURIComponent(SHANAH_POWER_COUPLES_GROUP_ID)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) return;
        const list = (data.events ?? []) as ChurchEvent[];
        setEvents(
          list
            .filter((event) => event.published !== false)
            .map((event) => ({ event, day: parseCouplesEventDay(event) }))
            .filter((entry) => entry.day && entry.day >= today)
            .sort((a, b) => a.day!.getTime() - b.day!.getTime())
            .map((entry) => entry.event),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const empty = !loading && events.length === 0;

  const modal =
    rsvpEvent && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[260] flex flex-col justify-end bg-[var(--couples-midnight)]/50 sm:justify-center sm:p-4">
            <button
              type="button"
              className="absolute inset-0"
              aria-label="Close"
              onClick={() => setRsvpEvent(null)}
            />
            <div className="relative mx-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-[1.25rem] bg-[var(--couples-ivory)] p-5 shadow-xl sm:rounded-[1.25rem]">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-[family-name:var(--font-couples-display)] text-lg font-semibold text-[var(--couples-text)]">
                  {rsvpEvent.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setRsvpEvent(null)}
                  className="rounded-full px-2 py-1 text-sm font-semibold text-[var(--couples-muted)]"
                >
                  Close
                </button>
              </div>
              <EventRsvpPanel event={rsvpEvent} canManage={false} />
            </div>
          </div>,
          document.body,
        )
      : null;

  const subtitle = useMemo(
    () =>
      "Couples dinners, marriage seminars, retreats, and other church gatherings for Power Couples.",
    [],
  );

  return (
    <div>
      <p className="text-sm leading-relaxed text-[var(--couples-muted)]">{subtitle}</p>
      {loading ? (
        <div className="mt-5">
          <CouplesLoadingSkeleton rows={3} />
        </div>
      ) : empty ? (
        <p className="mt-6 rounded-[1.125rem] bg-white px-4 py-8 text-center text-sm text-[var(--couples-muted)] ring-1 ring-[var(--couples-border)]">
          No upcoming events on the calendar yet. Check back soon or ask your group leaders.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {events.map((event) => (
            <li key={event.id}>
              <CouplesEventCard event={event} onRsvp={() => setRsvpEvent(event)} />
            </li>
          ))}
        </ul>
      )}
      {modal}
    </div>
  );
}
