import Link from "next/link";
import type { Devotion } from "@/lib/types";
import { getDevotionArtwork } from "@/lib/devotion-artwork";
import { MobilePremiumFrame } from "@/components/app/MobilePremiumFrame";

export function DevotionListItem({ devotion }: { devotion: Devotion }) {
  const artworkUrl = getDevotionArtwork(devotion, "wide");

  return (
    <MobilePremiumFrame variant="surface" className="mobile-devotion-list-item overflow-hidden">
      <Link
        href={`/devotions/${devotion.id}`}
        className="group block transition active:scale-[0.99] hover:shadow-md"
      >
        <div className="relative aspect-[16/10] min-h-[8rem] overflow-hidden bg-clay-800/15 sm:min-h-[9rem]">
          {artworkUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artworkUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : null}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night-950/88 via-night-950/35 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-clay-300/90">
              {devotion.date} · {devotion.readingTime}
            </p>
            <h3 className="mt-1 font-display text-lg font-semibold leading-snug tracking-tight text-white sm:text-xl">
              {devotion.title}
            </h3>
            {devotion.reference ? (
              <p className="mt-0.5 truncate text-xs text-sand-200/75 sm:text-sm">{devotion.reference}</p>
            ) : null}
          </div>
        </div>

        <div className="mobile-devotion-archive-footer flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <span className="text-xs font-medium text-night-500">Daily devotion</span>
          <span className="mobile-devotion-list-cta shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold text-white">
            Read
          </span>
        </div>
      </Link>
    </MobilePremiumFrame>
  );
}
