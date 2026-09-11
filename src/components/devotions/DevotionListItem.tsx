import Link from "next/link";
import type { Devotion } from "@/lib/types";
import { getDevotionCoverArtwork } from "@/lib/devotion-artwork";
import { MobilePremiumFrame } from "@/components/app/MobilePremiumFrame";

export function DevotionListItem({ devotion }: { devotion: Devotion }) {
  const artworkUrl = getDevotionCoverArtwork(devotion, "square");

  return (
    <MobilePremiumFrame variant="surface" className="mobile-devotion-list-item overflow-hidden">
      <Link
        href={`/devotions/${devotion.id}`}
        className="group flex min-h-[4.75rem] items-stretch bg-gradient-to-br from-white via-sand-50/80 to-clay-50/40 transition active:scale-[0.99] hover:shadow-md sm:min-h-[5rem]"
      >
        <div className="relative w-[4.25rem] shrink-0 overflow-hidden bg-sand-100 sm:w-[5rem]">
          {artworkUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artworkUrl}
              alt=""
              className="mobile-premium-4k__media h-full min-h-[4.75rem] w-full object-cover transition duration-500 group-hover:scale-[1.03] sm:min-h-[5rem]"
            />
          ) : null}
          <div
            className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-night-900/8"
            aria-hidden
          />
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3 sm:px-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-clay-700">
              {devotion.date} · {devotion.readingTime}
            </p>
            <h3 className="mt-0.5 font-display text-base font-semibold leading-snug tracking-tight text-night-900 sm:text-lg">
              {devotion.title}
            </h3>
            {devotion.reference ? (
              <p className="mt-0.5 truncate text-xs text-night-500">{devotion.reference}</p>
            ) : null}
          </div>
          <span className="mobile-devotion-list-cta hidden shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-white sm:inline-flex">
            Read
          </span>
          <span className="shrink-0 text-lg text-clay-700/70 sm:hidden" aria-hidden>
            →
          </span>
        </div>
      </Link>
    </MobilePremiumFrame>
  );
}
