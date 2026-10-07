"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getHomePortraitSlideDeck,
  type HomePortraitSlide,
} from "@/lib/home-portrait-slides";
import { site } from "@/lib/site";

type HomePastorPortraitProps = {
  variant?: "mobile" | "desktop";
  /** Side-blend (legacy) vs full-bleed cinematic slider. */
  layout?: "blend" | "cinema";
  className?: string;
};

const SLIDE_INTERVAL_MS = 6500;

function fallbackSlides(): HomePortraitSlide[] {
  const src = site.pastorPortrait || "/home/pastor-portrait.jpg";
  return [
    {
      src,
      label: "Shanah City",
      focus: "50% 22%",
      tone: "warm",
      motion: "zoom-in",
    },
  ];
}

/** Lead pastor / home gallery — premium 4K cinema crossfade with diverse curated deck. */
export function HomePastorPortrait({
  variant = "mobile",
  layout = "blend",
  className = "",
}: HomePastorPortraitProps) {
  const slides = useMemo(() => {
    const deck = getHomePortraitSlideDeck();
    return deck.length > 0 ? deck : fallbackSlides();
  }, []);

  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduceMotion || paused || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion, paused, slides.length]);

  const goTo = useCallback(
    (index: number) => {
      if (slides.length === 0) return;
      setActiveIndex(((index % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );

  if (slides.length === 0) return null;

  const cinema = layout === "cinema";
  const activeSlide = slides[activeIndex];
  const renderIndices = useMemo(() => {
    if (slides.length <= 3) return slides.map((_, index) => index);
    const prev = (activeIndex - 1 + slides.length) % slides.length;
    const next = (activeIndex + 1) % slides.length;
    return [prev, activeIndex, next];
  }, [activeIndex, slides.length]);

  return (
    <div
      className={`home-pastor-portrait home-pastor-portrait--${variant} ${
        cinema ? "home-pastor-portrait--cinema home-cinema-slider" : ""
      } pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="home-cinema-slider__stage absolute inset-0">
        {slides.map((slide, index) => {
          if (cinema && !renderIndices.includes(index)) return null;
          const isActive = index === activeIndex;
          return (
            <div
              key={slide.src}
              className={`home-cinema-slider__layer ${
                isActive ? "home-cinema-slider__layer--active" : ""
              }`}
              data-tone={slide.tone}
            >
              <Image
                src={slide.src}
                alt=""
                fill
                priority={index === 0}
                quality={92}
                sizes={
                  variant === "desktop"
                    ? "(max-width: 1024px) 100vw, 1600px"
                    : "(max-width: 768px) 100vw, 520px"
                }
                className={`home-cinema-slider__photo home-pastor-portrait__photo ${
                  isActive ? "home-pastor-portrait__photo--active" : ""
                } ${reduceMotion ? "home-pastor-portrait__photo--static" : ""} home-cinema-slider__photo--${slide.motion}`}
                style={{ objectPosition: slide.focus }}
              />
            </div>
          );
        })}
      </div>

      <div className="home-pastor-portrait__scrim absolute inset-0" />
      {cinema ? (
        <>
          <div className="home-cinema-slider__letterbox home-cinema-slider__letterbox--top" aria-hidden />
          <div className="home-cinema-slider__letterbox home-cinema-slider__letterbox--bottom" aria-hidden />
          <div className="mobile-premium-4k__shine pointer-events-none absolute inset-0 z-[2]" aria-hidden />
          <div className="mobile-premium-4k__grain pointer-events-none absolute inset-0 z-[2]" aria-hidden />
          <div className="home-cinema-slider__vignette pointer-events-none absolute inset-0 z-[2]" aria-hidden />
        </>
      ) : null}

      {cinema && slides.length > 1 ? (
        <div
          className="home-cinema-slider__chrome pointer-events-auto absolute inset-x-0 bottom-0 z-[3] px-4 pb-3 pt-8"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-end justify-between gap-3">
            <p className="home-cinema-slider__label truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90">
              {activeSlide.label}
            </p>
            <p className="shrink-0 text-[10px] font-medium tabular-nums text-white/65">
              {activeIndex + 1}/{slides.length}
            </p>
          </div>
          <div
            className="home-cinema-slider__progress mt-2"
            key={`progress-${activeIndex}-${paused ? "p" : "r"}`}
          >
            <div
              className={`home-cinema-slider__progress-bar ${
                reduceMotion || paused ? "home-cinema-slider__progress-bar--paused" : ""
              }`}
              style={{ animationDuration: `${SLIDE_INTERVAL_MS}ms` }}
            />
          </div>
          <div
            className="home-pastor-portrait__dots mt-2.5 flex justify-center gap-1.5"
            aria-hidden
          >
            {slides.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                tabIndex={-1}
                aria-label={`Show slide ${index + 1}`}
                className={`home-pastor-portrait__dot pointer-events-auto ${
                  index === activeIndex ? "home-pastor-portrait__dot--active" : ""
                }`}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
