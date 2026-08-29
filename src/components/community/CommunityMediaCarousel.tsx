"use client";

import { useEffect, useRef, useState } from "react";
import type { CommunityPostMediaItem } from "@/lib/member-types";
import { inferCommunityVideoContentType } from "@/lib/community-media-shared";

function resolveMediaUrl(url: string) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }
  if (typeof window !== "undefined") {
    try {
      return new URL(url, window.location.origin).toString();
    } catch {
      return url;
    }
  }
  return url;
}

function CarouselSlide({
  item,
  active,
}: {
  item: CommunityPostMediaItem;
  active: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaUrl = resolveMediaUrl(item.url);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || item.type !== "video") return;
    if (active) {
      void video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [active, item.type]);

  if (item.type === "video") {
    return (
      <video
        ref={videoRef}
        src={mediaUrl}
        controls
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
      >
        <source src={mediaUrl} type={inferCommunityVideoContentType(item.url)} />
      </video>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={mediaUrl} alt="" decoding="async" className="h-full w-full object-cover" />
  );
}

type CommunityMediaCarouselProps = {
  items: CommunityPostMediaItem[];
  compact?: boolean;
};

export function CommunityMediaCarousel({ items, compact }: CommunityMediaCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    function syncIndex() {
      if (!scroller) return;
      const width = scroller.clientWidth || 1;
      const nextIndex = Math.round(scroller.scrollLeft / width);
      setActiveIndex(Math.max(0, Math.min(items.length - 1, nextIndex)));
    }

    scroller.addEventListener("scroll", syncIndex, { passive: true });
    return () => scroller.removeEventListener("scroll", syncIndex);
  }, [items.length]);

  if (items.length === 0) return null;

  if (items.length === 1) {
    return (
      <div className={`border-y border-[#dadde1] bg-black ${compact ? "" : "community-media-carousel"}`}>
        <div className={compact ? "aspect-square max-h-56" : "max-h-[32rem] aspect-[4/5] sm:aspect-auto sm:max-h-[32rem]"}>
          <CarouselSlide item={items[0]} active />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative border-y border-[#dadde1] bg-black ${compact ? "" : "community-media-carousel"}`}>
      <div
        ref={scrollerRef}
        className="community-media-carousel-track"
        aria-label="Post media slides"
      >
        {items.map((item, index) => (
          <div key={`${item.url}-${index}`} className="community-media-carousel-slide">
            <CarouselSlide item={item} active={index === activeIndex} />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white">
        {activeIndex + 1}/{items.length}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
        {items.map((item, index) => (
          <span
            key={`${item.url}-dot-${index}`}
            className={`h-1.5 rounded-full transition-all ${
              index === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/45"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function CommunityMediaPreviewCarousel({
  items,
  onRemove,
}: {
  items: Array<{
    id: string;
    previewUrl: string;
    mediaType: "image" | "video";
    uploading?: boolean;
  }>;
  onRemove: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-xl bg-[#f0f2f5]">
      <div className="community-media-carousel-track max-h-56">
        {items.map((item) => (
          <div key={item.id} className="community-media-carousel-slide bg-black">
            {item.mediaType === "video" ? (
              <video src={item.previewUrl} controls playsInline className="h-full w-full object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="absolute right-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white"
            >
              Remove
            </button>
            {item.uploading ? (
              <div className="absolute inset-x-0 bottom-2 text-center text-xs font-semibold text-white">
                Uploading…
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {items.length > 1 ? (
        <p className="px-3 py-2 text-xs font-semibold text-[#65676b]">
          {items.length} items · swipe to preview
        </p>
      ) : null}
    </div>
  );
}
