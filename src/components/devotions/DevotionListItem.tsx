import Link from "next/link";
import type { Devotion } from "@/lib/types";
import { getDevotionArtwork } from "@/lib/devotion-artwork";

export function DevotionListItem({ devotion }: { devotion: Devotion }) {
  const artworkUrl = getDevotionArtwork(devotion, "square");

  return (
    <Link
      href={`/devotions/${devotion.id}`}
      className="mobile-devotion-list-item mobile-premium-surface group flex items-stretch overflow-hidden transition active:scale-[0.99] hover:shadow-md hover:ring-night-900/12"
    >
      <div className="relative w-[4.75rem] shrink-0 bg-night-900 sm:w-16">
        {artworkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artworkUrl}
            alt=""
            className="h-full min-h-[4.75rem] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-px bg-amber-400/45"
          aria-hidden
        />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3 sm:px-4 sm:py-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">
            {devotion.date}
          </p>
          <h3 className="mt-1 font-display text-base font-semibold leading-snug tracking-tight text-night-900 sm:text-lg">
            {devotion.title}
          </h3>
          <p className="mt-0.5 text-xs text-night-500">{devotion.readingTime}</p>
        </div>
        <span className="mobile-devotion-list-cta hidden shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-white sm:inline-flex">
          Read
        </span>
        <span className="shrink-0 text-lg text-teal-700/70 sm:hidden" aria-hidden>
          →
        </span>
      </div>
    </Link>
  );
}
