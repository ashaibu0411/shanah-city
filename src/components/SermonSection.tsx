import Link from "next/link";
import { latestSermon } from "@/lib/site";

export function SermonSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="overflow-hidden rounded-3xl bg-night-900 text-sand-50 md:grid md:grid-cols-2">
        <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-night-800 to-night-950 md:aspect-auto">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl">
              ▶
            </div>
            <p className="mt-4 text-sm text-sand-300">Latest message</p>
          </div>
        </div>

        <div className="p-8 md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sand-400">
            {latestSermon.series}
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold">
            {latestSermon.title}
          </h2>
          <p className="mt-4 leading-relaxed text-sand-200/90">
            {latestSermon.description}
          </p>
          <p className="mt-6 text-sm text-sand-300">
            {latestSermon.speaker} · {latestSermon.date}
          </p>
          <Link
            href="/sermons"
            className="mt-8 inline-block rounded-full bg-sand-100 px-5 py-2.5 text-sm font-semibold text-night-900 transition hover:bg-white"
          >
            Browse all sermons
          </Link>
        </div>
      </div>
    </section>
  );
}
