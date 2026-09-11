import Link from "next/link";
import { MobilePremiumFrame } from "@/components/app/MobilePremiumFrame";
import type { Devotion } from "@/lib/types";
import { getDevotionCoverArtwork } from "@/lib/devotion-artwork";

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
  const artworkUrl = getDevotionCoverArtwork(devotion, "wide");
  const href = `/devotions/${encodeURIComponent(devotion.id)}`;

  if (variant === "mobile") {
    return (
      <section className={className}>
        <h2 className="mobile-section-title mb-2.5 px-0.5">{eyebrow}</h2>
        <MobilePremiumFrame variant="cinema" className="mobile-devotion-spotlight">
          <Link href={href} className="group block transition active:scale-[0.99]">
            <div className="relative aspect-[2/1] min-h-[8rem] overflow-hidden bg-sand-100">
              {artworkUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artworkUrl}
                  alt=""
                  className="mobile-premium-4k__media absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="mobile-devotion-archive-footer px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay-700">
                {devotion.date} · {devotion.readingTime}
              </p>
              <p className="mt-1 font-display text-[1.05rem] font-semibold leading-snug tracking-tight text-night-950">
                {devotion.title}
              </p>
              {devotion.reference ? (
                <p className="mt-0.5 truncate text-xs text-night-500">{devotion.reference}</p>
              ) : null}
              <span className="mobile-devotion-spotlight-cta mt-2 inline-flex rounded-full px-3.5 py-1.5 text-[11px] font-bold text-white">
                Read
              </span>
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
