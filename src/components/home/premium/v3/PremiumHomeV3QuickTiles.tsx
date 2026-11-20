"use client";

import Link from "next/link";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { premiumHomeV3QuickTiles } from "@/lib/home-premium-v3";
import { PremiumHomeV3TileIcon } from "@/components/home/premium/v3/PremiumHomeV3Icons";
import { PremiumHomeV4Chevron } from "@/components/home/premium/v4/PremiumHomeV4Icons";

export function PremiumHomeV3QuickTiles() {
  return (
    <section className="ph4-section" aria-label="Quick actions">
      <div className="ph4-tile-grid">
        {premiumHomeV3QuickTiles.map((tile) => (
          <Link key={tile.id} href={tile.href} className="ph4-tile">
            <ChurchFlyerImage
              src={tile.image}
              alt=""
              sizes="(max-width: 512px) 50vw, 320px"
              quality={92}
              className={`ph4-tile__image ${tile.imageClass ?? ""}`.trim()}
            />
            <div className="ph4-tile__scrim" aria-hidden />
            <span className="ph4-tile__icon">
              <PremiumHomeV3TileIcon id={tile.id} className="h-6 w-6" />
            </span>
            <span className="ph4-tile__label">{tile.label}</span>
            <span className="ph4-tile__chevron" aria-hidden>
              <PremiumHomeV4Chevron className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
