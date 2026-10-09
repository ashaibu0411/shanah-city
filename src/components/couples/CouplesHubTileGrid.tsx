"use client";

import Link from "next/link";
import type { CouplesHubTile } from "@/lib/couples-hub-routes";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";

function toneClass(tone?: CouplesHubTile["tone"]) {
  return tone ? `couples-tile-tone-${tone}` : "";
}

export function CouplesHubTileGrid({
  tiles,
  locked,
  variant = "default",
  onActivateTile,
}: {
  tiles: CouplesHubTile[];
  locked?: boolean;
  variant?: "default" | "marriage" | "community-light";
  /** When set, tiles render as buttons and skip navigation (group hub community tiles). */
  onActivateTile?: (tile: CouplesHubTile) => void;
}) {
  const marriage = variant === "marriage";
  const communityLight = variant === "community-light";

  return (
    <div className={couplesHubPremium.tileGrid}>
      {tiles.map((tile) => {
        const disabled = locked && tile.requiresLink;
        const baseClass = marriage
          ? couplesHubPremium.tileMarriage
          : communityLight
            ? couplesHubPremium.tileCommunityLight
            : couplesHubPremium.tile;
        const className = `${baseClass} ${toneClass(tile.tone)} ${disabled ? "pointer-events-none opacity-50" : ""}`;

        const inner = marriage ? (
          <>
            <span className={couplesHubPremium.tileEmoji} aria-hidden>{tile.emoji}</span>
            <p className={couplesHubPremium.tileTitleMarriage}>{tile.title}</p>
          </>
        ) : (
          <>
            <span className={couplesHubPremium.tileEmoji} aria-hidden>{tile.emoji}</span>
            <div>
              <p className={communityLight ? couplesHubPremium.tileTitleLight : couplesHubPremium.tileTitle}>
                {tile.title}
              </p>
              <p className={communityLight ? couplesHubPremium.tileSubtitleLight : couplesHubPremium.tileSubtitle}>
                {tile.subtitle}
              </p>
            </div>
          </>
        );

        if (disabled) {
          return (
            <div key={tile.id} className={className} aria-disabled="true">
              {inner}
            </div>
          );
        }

        if (onActivateTile) {
          return (
            <button
              key={tile.id}
              type="button"
              className={className}
              onClick={() => onActivateTile(tile)}
            >
              {inner}
            </button>
          );
        }

        return (
          <Link key={tile.id} href={tile.href} className={className}>
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
