import Link from "next/link";
import { site } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-night-950 text-sand-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(192,168,130,0.25),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(82,107,145,0.2),_transparent_50%)]" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center md:py-32">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-sand-300">
            Welcome to
          </p>
          <h1 className="font-display text-5xl font-semibold leading-tight text-balance md:text-6xl">
            {site.name}
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-sand-200/90">
            {site.tagline}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/connect"
              className="rounded-full bg-sand-100 px-6 py-3 text-sm font-semibold text-night-900 transition hover:bg-white"
            >
              Plan Your Visit
            </Link>
            <Link
              href="/sermons"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-sand-50 transition hover:bg-white/10"
            >
              Watch Latest Sermon
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-sand-300">
            This Sunday
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold">
            Join us for worship
          </h2>
          <ul className="mt-6 space-y-4 text-sm text-sand-200/90">
            {site.serviceTimes.slice(0, 1).map((service) => (
              <li
                key={service.day}
                className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
              >
                <span>{service.label}</span>
                <span className="font-medium text-sand-100">{service.time}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-sand-300/80">
            Everyone is welcome. Come as you are — we&apos;d love to meet you.
          </p>
        </div>
      </div>
    </section>
  );
}
