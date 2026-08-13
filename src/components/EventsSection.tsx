import Link from "next/link";
import { upcomingEvents } from "@/lib/site";

export function EventsSection() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sand-600">
              Upcoming
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-night-900">
              Events
            </h2>
          </div>
          <Link
            href="/events"
            className="text-sm font-semibold text-night-700 hover:text-night-900"
          >
            View all events →
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {upcomingEvents.map((event) => (
            <article
              key={event.id}
              className="rounded-2xl border border-night-900/10 bg-sand-50 p-6 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="text-sm font-medium text-sand-600">{event.date}</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-night-900">
                {event.title}
              </h3>
              <p className="mt-3 text-sm text-night-600">
                {event.time} · {event.location}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
