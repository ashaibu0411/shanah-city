"use client";

import { useState } from "react";
import {
  isPortraitFlyerDimensions,
  urgentAlertFlyerImageClassName,
} from "@/lib/urgent-alert-flyer";

type UrgentAlertFlyerImageProps = {
  src: string;
  alt?: string;
  context?: "home" | "admin-preview";
  className?: string;
};

export function UrgentAlertFlyerImage({
  src,
  alt = "",
  context = "home",
  className = "",
}: UrgentAlertFlyerImageProps) {
  const [portrait, setPortrait] = useState<boolean | null>(null);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`${urgentAlertFlyerImageClassName(portrait, context)} ${className}`.trim()}
      onLoad={(event) => {
        const img = event.currentTarget;
        setPortrait(isPortraitFlyerDimensions(img.naturalWidth, img.naturalHeight));
      }}
    />
  );
}
