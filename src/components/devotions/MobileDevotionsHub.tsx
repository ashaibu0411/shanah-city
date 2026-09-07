import Link from "next/link";
import type { Devotion } from "@/lib/types";
import { getDevotionArtwork } from "@/lib/devotion-artwork";
import { MobilePremiumFrame } from "@/components/app/MobilePremiumFrame";

type MobileDevotionArchiveTileProps = {
  devotion: Devotion;
};

export function MobileDevotionArchiveTile({ devotion }: MobileDevotionArchiveTileProps) {
  const artworkUrl = getDevotionArtwork(devotion, "wide");
  const href = `/devotions/${encodeURIComponent(devotion.id)}`;

  return (
    <MobilePremiumFrame variant="cinema" className="mobile-devotion-archive-tile">
      <Link href={href} className="group relative block min-h-[9.5rem] transition active:scale-[0.99]">
        {artworkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artworkUrl}
            alt=""
            className="mobile-premium-4k__media absolute inset-0 h-full w-full object-cover transition duration-700 group-active:scale-[1.05]"
          />
        ) : (
          <div className="mobile-home-aurora-bg absolute inset-0" aria-hidden />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night-950/92 via-night-950/45 to-teal-900/10" />

        <div className="relative flex h-full min-h-[9.5rem] flex-col justify-end p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-100/90">
            {devotion.date} · {devotion.readingTime}
          </p>
          <p className="mt-1 font-display text-lg font-semibold leading-snug tracking-tight text-white drop-shadow-sm">
            {devotion.title}
          </p>
          {devotion.reference ? (
            <p className="mt-0.5 truncate text-xs text-sand-200/80">{devotion.reference}</p>
          ) : null}
          <span className="mobile-devotion-spotlight-cta mt-2.5 inline-flex w-fit rounded-full px-3 py-1.5 text-[11px] font-bold text-white">
            Read & listen
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
  const href = `/devotions/${encodeURIComponent(devotion.id)}`;

  return (
    <MobilePremiumFrame variant="cinema" className="mobile-devotion-featured-hero">
      <Link href={href} className="group relative block min-h-[14rem] transition active:scale-[0.99]">
        {artworkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artworkUrl}
            alt=""
            className="mobile-premium-4k__media absolute inset-0 h-full w-full object-cover transition duration-700 group-active:scale-[1.05]"
          />
        ) : (
          <div className="mobile-home-aurora-bg absolute inset-0" aria-hidden />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night-950/94 via-night-950/40 to-amber-500/10" />

        <div className="relative flex h-full min-h-[14rem] flex-col justify-between p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-200/95">
            Today&apos;s Word
          </p>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-100/90">
              {devotion.date} · {devotion.readingTime}
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-semibold leading-tight tracking-tight text-white drop-shadow-md">
              {devotion.title}
            </h2>
            {devotion.reference ? (
              <p className="mt-1 text-sm text-sand-200/85">{devotion.reference}</p>
            ) : null}
            <span className="mobile-devotion-spotlight-cta mt-3 inline-flex rounded-full px-3.5 py-2 text-xs font-bold text-white">
              Open today&apos;s devotion
            </span>
          </div>
        </div>
      </Link>
    </MobilePremiumFrame>
  );
}
