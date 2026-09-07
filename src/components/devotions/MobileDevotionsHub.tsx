import Link from "next/link";
import type { Devotion } from "@/lib/types";
import { getDevotionArtwork } from "@/lib/devotion-artwork";
import { MobilePremiumFrame } from "@/components/app/MobilePremiumFrame";

const archiveTones = [
  "from-white to-teal-50/85 ring-teal-200/45",
  "from-white to-amber-50/80 ring-amber-200/40",
  "from-white to-sand-100/90 ring-sand-300/45",
] as const;

function devotionHref(devotion: Devotion) {
  return `/devotions/${encodeURIComponent(devotion.id)}`;
}

type MobileDevotionArchiveTileProps = {
  devotion: Devotion;
  index: number;
};

export function MobileDevotionArchiveTile({ devotion, index }: MobileDevotionArchiveTileProps) {
  const artworkUrl = getDevotionArtwork(devotion, "square");
  const tone = archiveTones[index % archiveTones.length];

  return (
    <MobilePremiumFrame variant="surface" className="mobile-devotion-archive-tile">
      <Link
        href={devotionHref(devotion)}
        className={`group flex min-h-[5.25rem] items-stretch bg-gradient-to-br transition active:scale-[0.99] ${tone}`}
      >
        <div className="relative w-[4.75rem] shrink-0 bg-teal-900/10">
          {artworkUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artworkUrl}
              alt=""
              className="h-full min-h-[5.25rem] w-full object-cover transition duration-500 group-active:scale-[1.04]"
            />
          ) : null}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-px bg-teal-400/35"
            aria-hidden
          />
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">
              {devotion.date} · {devotion.readingTime}
            </p>
            <p className="mt-1 font-display text-base font-semibold leading-snug tracking-tight text-night-900">
              {devotion.title}
            </p>
            {devotion.reference ? (
              <p className="mt-0.5 truncate text-xs text-night-500">{devotion.reference}</p>
            ) : null}
          </div>
          <span className="mobile-devotion-spotlight-cta shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-white">
            Read
          </span>
        </div>
      </Link>
    </MobilePremiumFrame>
  );
}

type MobileDevotionFeaturedHeroProps = {
  devotion: Devotion;
};

export function MobileDevotionFeaturedHero({ devotion }: MobileDevotionFeaturedHeroProps) {
  const artworkUrl = getDevotionArtwork(devotion, "square");

  return (
    <section>
      <h2 className="mobile-section-title mb-2.5 px-0.5">Today&apos;s Word</h2>
      <MobilePremiumFrame variant="surface" className="mobile-devotion-featured-hero">
        <Link
          href={devotionHref(devotion)}
          className="group flex min-h-[6.25rem] items-stretch bg-gradient-to-br from-teal-50/95 via-white to-amber-50/75 transition active:scale-[0.99]"
        >
          <div className="relative w-[5.5rem] shrink-0 bg-teal-800">
            {artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artworkUrl}
                alt=""
                className="h-full min-h-[6.25rem] w-full object-cover transition duration-500 group-active:scale-[1.04]"
              />
            ) : null}
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-px bg-amber-400/50"
              aria-hidden
            />
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">
                {devotion.date} · {devotion.readingTime}
              </p>
              <p className="mt-1 font-display text-[1.08rem] font-semibold leading-snug tracking-tight text-night-900">
                {devotion.title}
              </p>
              {devotion.reference ? (
                <p className="mt-0.5 truncate text-xs text-night-500">{devotion.reference}</p>
              ) : null}
            </div>
            <span className="mobile-devotion-spotlight-cta shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-white">
              Open
            </span>
          </div>
        </Link>
      </MobilePremiumFrame>
    </section>
  );
}

export function MobileDevotionsPageHeader() {
  return (
    <div className="mobile-devotions-page-header overflow-hidden rounded-[1.35rem] p-4 ring-1 ring-teal-200/45">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-teal-700">Daily</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-night-900">
        Devotions
      </h1>
      <p className="mt-2 text-sm leading-snug text-night-600">
        Read or listen to today&apos;s word, then browse the library.
      </p>
    </div>
  );
}
