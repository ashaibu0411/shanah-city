import Link from "next/link";
import { MobilePageHero } from "@/components/app/MobilePageHero";
import { MobilePremiumFrame } from "@/components/app/MobilePremiumFrame";
import { DevotionCoverArt } from "@/components/devotions/DevotionCoverArt";
import type { Devotion } from "@/lib/types";

function devotionHref(devotion: Devotion) {
  return `/devotions/${encodeURIComponent(devotion.id)}`;
}

type MobileDevotionArchiveTileProps = {
  devotion: Devotion;
  index: number;
};

export function MobileDevotionArchiveTile({ devotion, index }: MobileDevotionArchiveTileProps) {
  const stagger = Math.min((index % 4) + 1, 4);

  return (
    <MobilePremiumFrame
      variant="surface"
      className={`mobile-devotion-archive-tile mobile-fade-up mobile-fade-up-${stagger}`}
    >
      <Link
        href={devotionHref(devotion)}
        className="theme-light-surface group flex min-h-[4.75rem] items-stretch bg-gradient-to-br from-white via-sand-50/80 to-clay-50/40 transition active:scale-[0.99] dark:from-[var(--color-bg-soft)] dark:via-[var(--color-surface)] dark:to-[var(--color-bg-muted)]"
      >
        <div className="relative w-[4.25rem] shrink-0">
          <DevotionCoverArt
            devotion={devotion}
            variant="square"
            className="h-full min-h-[4.75rem]"
            imageClassName="transition duration-500 group-active:scale-[1.04]"
          />
          <div
            className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-night-900/8"
            aria-hidden
          />
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-clay-700 dark:text-clay-200">
              {devotion.date} · {devotion.readingTime}
            </p>
            <p className="mt-0.5 font-display text-[0.98rem] font-semibold leading-snug tracking-tight text-night-900 dark:text-sand-100">
              {devotion.title}
            </p>
            {devotion.reference ? (
              <p className="mt-0.5 truncate text-xs text-night-500 dark:text-sand-400">{devotion.reference}</p>
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
  return (
    <section>
      <h2 className="mobile-section-title mb-2.5 px-0.5">Today&apos;s Word</h2>
      <MobilePremiumFrame variant="cinema" className="mobile-devotion-featured-hero">
        <Link href={devotionHref(devotion)} className="group block transition active:scale-[0.99]">
          <DevotionCoverArt
            devotion={devotion}
            variant="wide"
            className="aspect-[2/1] min-h-[8.5rem]"
          />

          <div className="mobile-devotion-archive-footer px-4 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay-700">
              {devotion.date} · {devotion.readingTime}
            </p>
            <h3 className="mt-1 font-display text-[1.12rem] font-semibold leading-snug tracking-tight text-night-950">
              {devotion.title}
            </h3>
            {devotion.reference ? (
              <p className="mt-0.5 text-xs text-night-500">{devotion.reference}</p>
            ) : null}
            <span className="mobile-devotion-spotlight-cta mt-2.5 inline-flex rounded-full px-3.5 py-1.5 text-[11px] font-bold text-white">
              Open devotion
            </span>
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
