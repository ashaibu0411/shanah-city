"use client";

import { BrandLogo } from "@/components/app/BrandLogo";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { site } from "@/lib/site";

type HomeMobileHeroProps = {
  greeting: string;
  heroImageSrc: string;
  campusLabel: string;
  nextServiceLabel: string;
};

export function HomeMobileHero({
  greeting,
  heroImageSrc,
  campusLabel,
  nextServiceLabel,
}: HomeMobileHeroProps) {
  return (
    <section className="mobile-home-hero relative -mx-4 overflow-hidden rounded-b-[1.75rem] text-white shadow-lg ring-1 ring-night-900/10 dark:ring-white/10">
      <div className="absolute inset-0">
        <ChurchFlyerImage
          src={heroImageSrc}
          alt=""
          priority
          sizes="100vw"
          className="mobile-home-hero__media h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-night-950/55 via-night-950/45 to-night-950/88"
          aria-hidden
        />
      </div>

      <div className="relative px-5 pb-6 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <p className="text-center text-[11px] font-semibold tracking-wide text-white/85">{greeting}</p>

        <div className="mt-4 flex flex-col items-center text-center">
          <BrandLogo size="lg" variant="dark" priority className="drop-shadow-md" />
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-sand-200/95">
            {site.heroChurchName}
          </p>
          <h1 className="mt-2 max-w-[18rem] font-home-hero text-[1.15rem] font-semibold leading-snug tracking-tight text-white">
            {site.tagline}
          </h1>
          <p className="mt-1.5 text-[11px] font-medium text-amber-200/95">{site.taglineReference}</p>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-white/80">{site.welcome}</p>
          <span className="mt-4 inline-flex rounded-full bg-white/15 px-3.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm ring-1 ring-white/20">
            Sun {nextServiceLabel} · {campusLabel}
          </span>
        </div>
      </div>
    </section>
  );
}
