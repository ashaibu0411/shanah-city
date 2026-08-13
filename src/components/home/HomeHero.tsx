import Link from "next/link";
import { BrandLogo } from "@/components/app/BrandLogo";
import { campuses, site } from "@/lib/site";
import { Button } from "@/components/ui";

const physicalCampuses = campuses.filter((campus) => campus.id !== "online");

export function HomeHero() {
  return (
    <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-night-950 via-night-900 to-night-800 text-white shadow-xl ring-1 ring-night-900/10">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sand-400/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-sand-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative grid gap-8 p-6 md:grid-cols-[1.2fr_1fr] md:p-8 lg:p-10">
        <div>
          <div className="flex items-center gap-4">
            <BrandLogo size="lg" priority />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sand-300">
                {site.name}
              </p>
            </div>
          </div>

          <h1 className="mt-6 font-display text-3xl font-semibold leading-tight text-balance md:text-4xl lg:text-[2.75rem]">
            {site.tagline}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80">
            {site.scripture} · Join us in Aurora, Accra, or online — one family,
            one vision.
          </p>
          <p className="mt-3 text-sm italic text-sand-200">{site.welcome}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/live" className="bg-sand-400 text-night-950 hover:bg-sand-300">
              Watch live
            </Button>
            <Button
              href={site.visitCTA.href}
              variant="secondary"
              className={`bg-gradient-to-r ${site.visitCTA.gradient} text-white hover:opacity-90`}
            >
              Plan a visit
            </Button>
            <Button href="/campuses" variant="ghost" className="text-sand-100 hover:bg-white/10">
              Our campuses
            </Button>
          </div>
        </div>

        <div className="flex flex-col justify-end gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-sand-300">
              Service times
            </p>
            <ul className="mt-3 space-y-3">
              {site.serviceTimes.map((service) => (
                <li key={service.day} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-semibold text-white">{service.day}</p>
                    <p className="text-white/65">{service.label}</p>
                  </div>
                  <p className="text-right font-medium text-sand-200">{service.time}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-white/55">
              Colorado campus · Streamed Fri & Sun on YouTube
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {physicalCampuses.map((campus) => (
              <Link
                key={campus.id}
                href="/campuses"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-sand-400/40 hover:bg-white/10"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-sand-300">
                  {campus.city}
                </p>
                <p className="mt-1 text-sm font-semibold text-white">{campus.name}</p>
                <p className="mt-1 text-xs text-white/60">
                  {campus.address ?? `${campus.city}, ${campus.country}`}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
