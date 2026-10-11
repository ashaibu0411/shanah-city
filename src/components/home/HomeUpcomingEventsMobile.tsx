"use client";

import Link from "next/link";
import type { ChurchEvent } from "@/lib/types";
import { formatHomeEventMeta } from "@/lib/home-upcoming-events";

export function HomeUpcomingEventsMobile({ events }: { events: ChurchEvent[] }) {
  if (events.length === 0) return null;

  return (
    <section>
      <div className="mb-2.5 flex items-end justify-between gap-2 px-0.5">
        <h2 className="mobile-section-title">Upcoming events</h2>
        <Link href="/calendar" className="text-xs font-semibold text-teal-800 dark:text-teal-300">
          See all
        </Link>
      </div>

      <ul className="space-y-2">
        {events.map((event) => {
          const { day, meta } = formatHomeEventMeta(event);
          const month = day?.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
          const dayNum = day?.getDate();

          return (
            <li key={event.id}>
              <Link
                href="/calendar"
                className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-night-900/8 transition active:scale-[0.99] dark:bg-[var(--color-surface)] dark:ring-white/10"
              >
                <div
                  className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-teal-50 text-center dark:bg-teal-950/40"
                  aria-hidden
                >
                  <span className="text-[9px] font-bold uppercase tracking-wide text-teal-800 dark:text-teal-200">
                    {month ?? "—"}
                  </span>
                  <span className="text-lg font-semibold leading-none text-teal-900 dark:text-teal-100">
                    {dayNum ?? "·"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-night-900 dark:text-sand-100">{event.title}</p>
                  <p className="mt-0.5 text-sm text-night-600 dark:text-sand-400">{meta}</p>
                  {event.location?.trim() ? (
                    <p className="mt-0.5 truncate text-xs text-night-500 dark:text-sand-500">{event.location}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-lg text-night-400" aria-hidden>›</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
