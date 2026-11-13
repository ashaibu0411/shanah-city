"use client";

import { useEffect, useRef, useState } from "react";
import { UrgentAlertFlyerImage } from "@/components/urgent-alert/UrgentAlertFlyerImage";
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

function CommunityFlyerFrame({ src, alt = "" }: { src: string; alt?: string }) {
  return (
    <div className="community-media-flyer-frame">
      <div
        className="community-media-flyer-backdrop"
        style={{ backgroundImage: `url("${src.replace(/"/g, "%22")}")` }}
        aria-hidden
      />
      <div className="community-media-flyer-scrim" aria-hidden />
      <div className="community-media-flyer-foreground">
        <UrgentAlertFlyerImage src={src} alt={alt} context="community" />
      </div>
    </div>
  );
}

function CarouselSlide({
  item,
  active,
  imageFit = "cover",
  videoFit = "contain",
  onVideoMetadata,
}: {
  item: CommunityPostMediaItem;
  active: boolean;
  imageFit?: "cover" | "contain";
  videoFit?: "cover" | "contain";
  onVideoMetadata?: (ratio: number) => void;
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
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            onVideoMetadata?.(video.videoWidth / video.videoHeight);
          }
        }}
        className={`community-media-slide-video h-full w-full ${
          videoFit === "cover" ? "object-cover" : "object-contain"
        }`}
      >
        <source src={mediaUrl} type={inferCommunityVideoContentType(item.url)} />
      </video>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl}
      alt=""
      decoding="async"
      className={
        imageFit === "contain"
          ? "community-media-flyer-img"
          : "h-full w-full object-cover"
      }
    />
  );
}

type CommunityMediaCarouselProps = {
  items: CommunityPostMediaItem[];
  compact?: boolean;
  /** Show full graphics without cropping (urgent flyers, announcements). */
  imageFit?: "cover" | "contain";
  /** Use urgent-alert flyer sizing (portrait vs landscape). */
  flyerLayout?: boolean;
  /** Edge-to-edge social feed (16:9 video, full-width photos). */
  socialFeedMedia?: boolean;
};

export function CommunityMediaCarousel({
  items,
  compact,
  imageFit = "cover",
  flyerLayout = false,
  socialFeedMedia = false,
}: CommunityMediaCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mediaRatios, setMediaRatios] = useState<Record<number, number>>({});

  function recordVideoRatio(index: number, ratio: number) {
    if (!Number.isFinite(ratio) || ratio <= 0) return;
    setMediaRatios((current) => current[index] === ratio ? current : { ...current, [index]: ratio });
  }

  useEffect(() => {
    setActiveIndex(0);
    setMediaRatios({});
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

  const contain = imageFit === "contain";
  const carouselShellClass = contain
    ? "community-media-carousel community-media-carousel-contain"
    : "community-media-carousel";
  const singleFrameClass = contain
    ? "community-media-photo-frame"
    : compact
      ? "aspect-square max-h-56"
      : "max-h-[32rem] aspect-[4/5] sm:aspect-auto sm:max-h-[32rem]";

  if (items.length === 1 && flyerLayout && items[0].type === "image") {
    return (
      <div
        className={`border-y border-night-900/10 bg-black ${compact ? "" : "community-media-carousel community-media-carousel-contain"}`}
      >
        <CommunityFlyerFrame src={resolveMediaUrl(items[0].url)} />
      </div>
    );
  }

  if (items.length === 1) {
    const item = items[0];
    const socialFrame =
      socialFeedMedia && item.type === "video"
        ? "community-media-social-video-frame"
        : socialFeedMedia && item.type === "image"
          ? "community-media-social-photo-frame"
          : singleFrameClass;
    return (
      <div
        className={
          socialFeedMedia
            ? "community-media-social-shell"
            : `border-y border-night-900/10 bg-black ${compact ? "" : carouselShellClass}`
        }
      >
        <div
          className={socialFeedMedia ? socialFrame : singleFrameClass}
          style={socialFeedMedia && item.type === "video" && mediaRatios[0]
            ? { aspectRatio: String(mediaRatios[0]) }
            : undefined}
        >
          <CarouselSlide
            item={items[0]}
            active
            imageFit={imageFit}
            videoFit="contain"
            onVideoMetadata={socialFeedMedia && item.type === "video"
              ? (ratio) => recordVideoRatio(0, ratio)
              : undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative ${socialFeedMedia ? "community-media-social-shell border-0 bg-transparent" : "border-y border-night-900/10 bg-black"} ${compact ? "" : carouselShellClass}`}
    >
      <div
        ref={scrollerRef}
        className="community-media-carousel-track"
        aria-label="Post media slides"
      >
        {items.map((item, index) => (
          <div
            key={`${item.url}-${index}`}
            className="community-media-carousel-slide"
            style={socialFeedMedia && item.type === "video" && mediaRatios[index]
              ? { aspectRatio: String(mediaRatios[index]) }
              : undefined}
          >
            <CarouselSlide
              item={item}
              active={index === activeIndex}
              imageFit={imageFit}
              videoFit="contain"
              onVideoMetadata={socialFeedMedia && item.type === "video"
                ? (ratio) => recordVideoRatio(index, ratio)
                : undefined}
            />
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
    <div className="mt-3 overflow-hidden rounded-xl bg-sand-100">
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
        <p className="px-3 py-2 text-xs font-semibold text-night-600">
          {items.length} items · swipe to preview
        </p>
      ) : null}
    </div>
  );
}
