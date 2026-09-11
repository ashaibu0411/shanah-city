import Link from "next/link";
import { MobilePageHero } from "@/components/app/MobilePageHero";
import { MobilePremiumFrame } from "@/components/app/MobilePremiumFrame";
import { getDevotionArtwork } from "@/lib/devotion-artwork";
import type { Devotion } from "@/lib/types";

function devotionHref(devotion: Devotion) {
  return `/devotions/${encodeURIComponent(devotion.id)}`;
}

type MobileDevotionArchiveTileProps = {
  devotion: Devotion;
  index: number;
};

export function MobileDevotionArchiveTile({ devotion, index }: MobileDevotionArchiveTileProps) {
  const artworkUrl = getDevotionArtwork(devotion, "wide");
  const stagger = Math.min((index % 4) + 1, 4);

  return (
    <MobilePremiumFrame
      variant="surface"
      className={`mobile-devotion-archive-tile mobile-fade-up mobile-fade-up-${stagger}`}
    >
      <Link href={devotionHref(devotion)} className="group block transition active:scale-[0.99]">
        <div className="relative aspect-[16/10] min-h-[7.5rem] overflow-hidden bg-clay-800/15">
          {artworkUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artworkUrl}
              alt=""
              className="mobile-premium-4k__media absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night-950/90 via-night-950/40 to-night-950/5"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 z-10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay-300/90">
              {devotion.date}
            </p>
            <p className="mt-1 font-display text-[1.05rem] font-semibold leading-snug tracking-tight text-white drop-shadow-sm">
              {devotion.title}
            </p>
            {devotion.reference ? (
              <p className="mt-0.5 truncate text-xs text-sand-200/75">{devotion.reference}</p>
            ) : null}
          </div>
        </div>

        <div className="mobile-devotion-archive-footer flex items-center justify-between gap-3 px-4 py-3">
          <p className="text-xs font-medium text-night-500">{devotion.readingTime}</p>
          <span className="mobile-devotion-spotlight-cta shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold text-white">
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
  const artworkUrl = getDevotionArtwork(devotion, "wide");

  return (
    <section>
      <h2 className="mobile-section-title mb-2.5 px-0.5">Today&apos;s Word</h2>
      <MobilePremiumFrame variant="cinema" className="mobile-devotion-featured-hero">
        <Link href={devotionHref(devotion)} className="group block transition active:scale-[0.99]">
          <div className="relative aspect-[4/3] min-h-[13rem] w-full sm:min-h-[14rem]">
            {artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artworkUrl}
                alt=""
                className="mobile-premium-4k__media absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-clay-800 via-night-900 to-sand-200/40" />
            )}
            <div
              className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-night-950/92 via-night-950/48 to-clay-900/10"
              aria-hidden
            />
            <div className="relative z-20 flex h-full min-h-[13rem] flex-col justify-between p-4 sm:min-h-[14rem]">
              <span className="mobile-devotion-featured-badge inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-sand-100 backdrop-blur-sm">
                Featured
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-clay-300">
                  {devotion.date} · {devotion.readingTime}
                </p>
                <h3 className="mt-1.5 font-display text-[1.35rem] font-semibold leading-[1.12] tracking-tight text-white drop-shadow-md">
                  {devotion.title}
                </h3>
                {devotion.reference ? (
                  <p className="mt-1 text-sm text-sand-200/80">{devotion.reference}</p>
                ) : null}
                <span className="mobile-devotion-spotlight-cta mt-3 inline-flex rounded-full px-4 py-2 text-xs font-bold text-white">
                  Open devotion
                </span>
              </div>
            </div>
          </div>
        </Link>
      </MobilePremiumFrame>
    </section>
  );
}

export function MobileDevotionsPageHeader() {
  return (
    <MobilePageHero
      eyebrow="Daily"
      title="Devotions"
      accentWord="Devotions"
      description="Read or listen to today's word, then browse the library."
    />
  );
}
