import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { MobilePremiumFrame } from "@/components/app/MobilePremiumFrame";
import type { ChurchSocialImages } from "@/lib/facebook-church-media";
import type { MediaTab } from "@/lib/types";

type MobileMediaHeroProps = {
  tab: MediaTab;
  anyLive: boolean;
  clipsCount: number;
  churchImages: ChurchSocialImages;
};

export function MobileMediaHero({
  tab,
  anyLive,
  clipsCount,
  churchImages,
}: MobileMediaHeroProps) {
  const isLive = tab === "live";
  const heroSrc = isLive ? churchImages.mediaLive : churchImages.mediaShorts;

  return (
    <MobilePremiumFrame variant="cinema" className="mobile-media-hero aspect-[16/9] shadow-app-lg ring-1 ring-night-900/10">
      <ChurchFlyerImage
        src={heroSrc}
        alt={isLive ? "Watch live" : "Shorts and highlights"}
        priority
        sizes="(max-width: 512px) 100vw, 480px"
        className="mobile-premium-4k__media mobile-media object-cover"
      />
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-night-950/88 via-night-950/40 to-teal-900/10" />

      <div className="relative z-20 flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sand-200/90">
            Shanah City Media
          </p>
          {anyLive && isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-red-900/40">
              <span className="mobile-home-pulse h-1.5 w-1.5 rounded-full bg-white" />
              Live
            </span>
          ) : null}
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-md">
            {isLive ? "Watch Live" : "Shorts & Highlights"}
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-100/75">
            {isLive
              ? "YouTube · Facebook · Instagram"
              : clipsCount > 0
                ? `${clipsCount} clips · Swipe to explore`
                : "Worship moments on demand"}
          </p>
        </div>
      </div>
    </MobilePremiumFrame>
  );
}
