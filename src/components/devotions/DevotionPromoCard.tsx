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
  const artworkUrl = getDevotionArtwork(devotion, variant === "mobile" ? "square" : "wide");
  const href = `/devotions/${encodeURIComponent(devotion.id)}`;

  if (variant === "mobile") {
    return (
      <section className={className}>
        <h2 className="mobile-section-title mb-2.5 px-0.5">{eyebrow}</h2>
        <MobilePremiumFrame variant="surface" className="mobile-devotion-spotlight">
          <Link
            href={href}
            className="group block transition active:scale-[0.99]"
          >
          <div className="flex min-h-[5.5rem]">
            <div className="relative w-[5.25rem] shrink-0 bg-night-900">
              {artworkUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artworkUrl}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-active:scale-[1.04]"
                />
              ) : null}
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night-950/50 to-transparent"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-px bg-amber-400/50"
                aria-hidden
              />
            </div>

            <div className="mobile-devotion-spotlight-body flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">
                  {devotion.date} · {devotion.readingTime}
                </p>
                <p className="mt-1 font-display text-[1.05rem] font-semibold leading-snug tracking-tight text-night-900">
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-sand-600">
              {devotion.date} · {devotion.readingTime}
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-night-900">
              {devotion.title}
            </p>
            <p className="mt-1 text-sm text-night-600">{devotion.reference}</p>
          </div>
          <span className="shrink-0 rounded-full bg-night-900 px-3 py-1.5 text-xs font-bold text-white">
            Open
          </span>
        </div>
      </Link>
    </div>
  );
}
