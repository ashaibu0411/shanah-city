import Link from "next/link";
import { MobilePremiumFrame } from "@/components/app/MobilePremiumFrame";
import type { Devotion } from "@/lib/types";
import { getDevotionArtwork } from "@/lib/devotion-artwork";

type DevotionPromoCardProps = {
  devotion: Devotion;
  eyebrow?: string;
  className?: string;
  variant?: "default" | "mobile";
};

export function DevotionPromoCard({
  devotion,
  eyebrow = "Today's Word",
  className = "",
  variant = "default",
}: DevotionPromoCardProps) {
  const artworkUrl = getDevotionArtwork(devotion, variant === "mobile" ? "wide" : "wide");
  const href = `/devotions/${encodeURIComponent(devotion.id)}`;

  if (variant === "mobile") {
    return (
      <section className={className}>
        <h2 className="mobile-section-title mb-2.5 px-0.5">{eyebrow}</h2>
        <MobilePremiumFrame variant="cinema" className="mobile-devotion-spotlight">
          <Link href={href} className="group block transition active:scale-[0.99]">
            <div className="relative aspect-[16/10] min-h-[9rem] w-full">
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
                className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-night-950/90 via-night-950/45 to-clay-900/10"
                aria-hidden
              />
              <div className="relative z-20 flex h-full min-h-[9rem] flex-col justify-end p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay-300">
                  {devotion.date} · {devotion.readingTime}
                </p>
                <p className="mt-1 font-display text-[1.1rem] font-semibold leading-snug tracking-tight text-white drop-shadow-md">
                  {devotion.title}
                </p>
                {devotion.reference ? (
                  <p className="mt-0.5 truncate text-xs text-sand-200/80">{devotion.reference}</p>
                ) : null}
                <span className="mobile-devotion-spotlight-cta mt-3 inline-flex w-fit rounded-full px-3.5 py-1.5 text-[11px] font-bold text-white">
                  Read
                </span>
              </div>
            </div>
          </Link>
        </MobilePremiumFrame>
      </section>
    );
  }

  return (
    <div className={className}>
      <p className="px-0.5 text-[11px] font-bold uppercase tracking-[0.22em] text-night-500">
        {eyebrow}
      </p>
      <Link
        href={href}
        className="mt-2 block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-night-900/5 transition hover:shadow-md active:scale-[0.99]"
      >
        {artworkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artworkUrl} alt="" className="aspect-[16/9] w-full object-cover" />
        ) : null}
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-clay-600">
              {devotion.date} · {devotion.readingTime}
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-night-900">
              {devotion.title}
            </p>
            <p className="mt-1 text-sm text-night-600">{devotion.reference}</p>
          </div>
          <span className="shrink-0 rounded-full bg-clay-600 px-3 py-1.5 text-xs font-bold text-white">
            Open
          </span>
        </div>
      </Link>
    </div>
  );
}
