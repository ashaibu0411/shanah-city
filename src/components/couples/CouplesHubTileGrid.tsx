"use client";

import Link from "next/link";
import type { CouplesHubTile } from "@/lib/couples-hub-routes";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";

export function CouplesHubTileGrid({
  tiles,
  locked,
}: {
  tiles: CouplesHubTile[];
  locked?: boolean;
}) {
  return (
    <div className={couplesHubPremium.tileGrid}>
      {tiles.map((tile) => {
        const disabled = locked && tile.requiresLink;
        const className = `${couplesHubPremium.tile} ${disabled ? "pointer-events-none opacity-55" : ""}`;

        if (disabled) {
          return (
            <div key={tile.id} className={className} aria-disabled="true">
              <span className={couplesHubPremium.tileEmoji} aria-hidden>{tile.emoji}</span>
              <div>
                <p className={couplesHubPremium.tileTitle}>{tile.title}</p>
                <p className={couplesHubPremium.tileSubtitle}>{tile.subtitle}</p>
              </div>
            </div>
          );
        }

        return (
          <Link key={tile.id} href={tile.href} className={className}>
            <span className={couplesHubPremium.tileEmoji} aria-hidden>{tile.emoji}</span>
            <div>
              <p className={couplesHubPremium.tileTitle}>{tile.title}</p>
              <p className={couplesHubPremium.tileSubtitle}>{tile.subtitle}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
