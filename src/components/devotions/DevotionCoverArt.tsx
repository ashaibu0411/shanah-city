import type { ArtworkVariant } from "@/lib/content-artwork";
import { getDevotionCoverArtwork } from "@/lib/devotion-artwork";
import { site } from "@/lib/site";
import type { Devotion } from "@/lib/types";

type DevotionCoverArtProps = {
  devotion: Devotion;
  variant?: ArtworkVariant;
  className?: string;
  imageClassName?: string;
};

export function DevotionCoverArt({
  devotion,
  variant = "wide",
  className = "",
  imageClassName = "",
}: DevotionCoverArtProps) {
  const artworkUrl = getDevotionCoverArtwork(devotion, variant);
  const compact = variant === "square";

  return (
    <div
      className={`devotion-cover-art devotion-cover-art--${variant} relative overflow-hidden bg-sand-100 ${className}`}
    >
      {artworkUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artworkUrl}
          alt=""
          className={`devotion-cover-art__background mobile-premium-4k__media ${imageClassName}`}
        />
      ) : null}

      <div className="devotion-cover-art__overlay pointer-events-none absolute inset-0" aria-hidden>
        <div className={`devotion-cover-art__brand ${compact ? "devotion-cover-art__brand--compact" : ""}`}>
          <div className="devotion-cover-art__portrait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={site.pastorPortrait} alt="" decoding="async" />
          </div>
          <p className="devotion-cover-art__label">Daily Word</p>
        </div>
      </div>
    </div>
  );
}
