import Image from "next/image";
import type { MediaTab } from "@/lib/types";

type MobileMediaHeroProps = {
  tab: MediaTab;
  anyLive: boolean;
  clipsCount: number;
};

export function MobileMediaHero({ tab, anyLive, clipsCount }: MobileMediaHeroProps) {
  const isLive = tab === "live";

  return (
    <section className="mobile-media-hero relative aspect-[16/9] overflow-hidden rounded-2xl shadow-app-lg ring-1 ring-night-900/10">
      <div className="absolute inset-[3px] rounded-[0.85rem] ring-1 ring-white/20" aria-hidden />
      <Image
        src={isLive ? "/mobile-flyers/live.png" : "/mobile-flyers/media-shorts.png"}
        alt={isLive ? "Watch live" : "Shorts and highlights"}
        fill
        sizes="(max-width: 512px) 100vw, 480px"
        priority
        className="mobile-media object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night-950/92 via-night-900/40 to-night-800/20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.12),transparent_42%)]" />

      <div className="relative flex h-full flex-col justify-between p-4">
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
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-sand-200/75">
            {isLive
              ? "YouTube · Facebook · Instagram"
              : clipsCount > 0
                ? `${clipsCount} clips · Swipe to explore`
                : "Worship moments on demand"}
          </p>
        </div>
      </div>
    </section>
  );
}
