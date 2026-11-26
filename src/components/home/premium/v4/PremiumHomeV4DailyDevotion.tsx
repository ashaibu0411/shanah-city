"use client";

import Link from "next/link";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { getDevotionCoverArtwork } from "@/lib/devotion-artwork";
import { premiumV4DevotionsBibleImage } from "@/lib/home-premium-v4";
import { PremiumHomeV4Chevron } from "@/components/home/premium/v4/PremiumHomeV4Icons";
import type { Devotion } from "@/lib/types";

/** Featured daily devotion entry on authenticated home (mobile + desktop V4). */
export function PremiumHomeV4DailyDevotion({
  className = "",
  devotion = null,
}: {
  className?: string;
  devotion?: Devotion | null;
}) {
  const href = devotion ? `/devotions/${devotion.id}` : "/devotions";
  const image = devotion ? getDevotionCoverArtwork(devotion, "square") : premiumV4DevotionsBibleImage;
  const title = devotion?.title?.trim() || "Today's devotion";
  const scripture = devotion?.reference?.trim() || devotion?.verse?.trim() || "";

  return (
    <section className={`ph4-section ${className}`.trim()} aria-labelledby="ph4-devotion-title">
      <Link href={href} className="ph4-devotion-card">
        <ChurchFlyerImage
          src={image}
          alt=""
          sizes="(max-width: 512px) 92vw, 520px"
          className="ph4-devotion-card__image"
        />
        <span className="ph4-devotion-card__body">
          <span className="ph4-devotion-card__label">Today&apos;s devotion</span>
          <span id="ph4-devotion-title" className="ph4-devotion-card__title">
            {title}
          </span>
          {scripture ? (
            <span className="ph4-devotion-card__hint">{scripture}</span>
          ) : (
            <span className="ph4-devotion-card__hint">Open today&apos;s reading in the archive.</span>
          )}
        </span>
        <span className="ph4-devotion-card__chevron" aria-hidden>
          <PremiumHomeV4Chevron />
        </span>
      </Link>
    </section>
  );
}