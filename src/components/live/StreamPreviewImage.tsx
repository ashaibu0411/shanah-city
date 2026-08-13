"use client";

import { useState } from "react";
import type { StreamPreview } from "@/lib/types";
import {
  getStreamFallbackThumbnail,
  getStreamThumbnail,
} from "@/lib/streams";

type StreamPreviewImageProps = {
  preview: StreamPreview;
  alt: string;
  className?: string;
};

export function StreamPreviewImage({
  preview,
  alt,
  className = "h-full w-full object-cover",
}: StreamPreviewImageProps) {
  const [src, setSrc] = useState(() => getStreamThumbnail(preview));

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        const fallback = getStreamFallbackThumbnail(preview);
        if (fallback !== src) {
          setSrc(fallback);
        }
      }}
    />
  );
}
