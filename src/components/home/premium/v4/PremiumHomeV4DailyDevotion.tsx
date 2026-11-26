"use client";

import Link from "next/link";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { premiumV4DevotionsBibleImage } from "@/lib/home-premium-v4";
import { PremiumHomeV4Chevron } from "@/components/home/premium/v4/PremiumHomeV4Icons";

/** Featured daily devotion entry on authenticated home (mobile + desktop V4). */
export function PremiumHomeV4DailyDevotion({ className = "" }: { className?: string }) {
  return (
    <section className={`ph4-section ${className}`.trim()} aria-labelledby="ph4-devotion-heading">
      <div className="ph4-section__head">
        <h2 id="ph4-devotion-heading" className="ph4-section__title">
          Daily devotion
        </h2>
        <Link href="/devotions" className="ph4-section__link">
          Archive →
        </Link>
      </div>
      <Link href="/devotions" className="ph4-devotion-card">
        <ChurchFlyerImage
          src={premiumV4DevotionsBibleImage}
          alt=""
          sizes="(max-width: 512px) 92vw, 520px"
          className="ph4-devotion-card__image"
        />
        <span className="ph4-devotion-card__body">
          <span className="ph4-devotion-card__label">Today&apos;s reading</span>
          <span className="ph4-devotion-card__title">Open today&apos;s devotion</span>
          <span className="ph4-devotion-card__hint">A short word for your morning or evening.</span>
        </span>
        <span className="ph4-devotion-card__chevron" aria-hidden>
          <PremiumHomeV4Chevron />
        </span>
      </Link>
    </section>
  );
}