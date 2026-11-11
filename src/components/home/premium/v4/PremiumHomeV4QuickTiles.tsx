"use client";

import Link from "next/link";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { premiumHomeV4QuickTiles } from "@/lib/home-premium-v4";
import { PremiumHomeV4TileIcon } from "@/components/home/premium/v4/PremiumHomeV4Icons";

export function PremiumHomeV4QuickTiles() {
  return (
    <section className="ph4-section" aria-label="Quick actions">
      <div className="ph4-tile-grid">
        {premiumHomeV4QuickTiles.map((tile) => (
          <Link key={tile.id} href={tile.href} className="ph4-tile">
            <ChurchFlyerImage
              src={tile.image}
              alt=""
              priority
              sizes="(max-width: 512px) 45vw, 220px"
              className={`ph4-tile__image ${tile.imageClass ?? ""}`.trim()}
            />
            <TileScrim />
            <span className="ph4-tile__icon">
              <PremiumHomeV4TileIcon id={tile.id} className="h-6 w-6" />
            </span>
            <span className="ph4-tile__label">{tile.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TileScrim() {
  return <div className="ph4-tile__scrim" aria-hidden />;
}
