import { site } from "@/lib/site";

export function WelcomeSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sand-600">
            Who We Are
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-night-900">
            A city on a hill, a family in faith
          </h2>
        </div>
        <p className="text-lg leading-relaxed text-night-600">
          {site.description} At {site.name}, we gather to worship, grow in
          God&apos;s Word, and serve our neighbors with love. Whether you&apos;re
          exploring faith for the first time or looking for a church home,
          there&apos;s a place for you here.
        </p>
      </div>
    </section>
  );
}
