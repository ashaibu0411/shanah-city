import Image from "next/image";
import { latestSermon } from "@/lib/site";
import { Button } from "@/components/ui";

export function SermonCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-night-900 text-sand-50 ring-1 ring-night-900/10 md:grid md:grid-cols-2">
      <div className={`relative ${compact ? "aspect-video" : "aspect-video md:aspect-auto md:min-h-[280px]"}`}>
        <Image
          src="/sermons/latest-message.svg"
          alt={`${latestSermon.title} sermon graphic`}
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <a
          href={latestSermon.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center bg-night-950/20 transition hover:bg-night-950/35"
          aria-label="Watch on YouTube"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-2xl text-night-900 shadow-lg">
            ▶
          </span>
        </a>
      </div>

      <div className={compact ? "p-6" : "p-8 md:p-10"}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sand-400">
          {latestSermon.series}
        </p>
        <h2 className={`mt-3 font-display font-semibold ${compact ? "text-2xl" : "text-3xl"}`}>
          {latestSermon.title}
        </h2>
        <p className="mt-4 leading-relaxed text-sand-100">
          {latestSermon.description}
        </p>
        <p className="mt-5 text-sm text-sand-300">
          {latestSermon.speaker} · {latestSermon.date}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={latestSermon.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-sand-100 px-4 py-2.5 text-sm font-semibold text-night-900 transition hover:bg-sand-200"
          >
            Watch on YouTube
          </a>
          {!compact && (
            <Button href="/sermons" variant="ghost" className="text-sand-100 hover:bg-white/10">
              All sermons
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
