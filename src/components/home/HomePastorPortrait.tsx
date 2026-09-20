"use client";

import { useEffect, useMemo, useState } from "react";
import { site } from "@/lib/site";

type HomePastorPortraitProps = {
  variant?: "mobile" | "desktop";
  /** Side-blend (legacy) vs full-bleed cinematic slider. */
  layout?: "blend" | "cinema";
  className?: string;
};

const SLIDE_INTERVAL_MS = 5500;

/** Lead pastor / home gallery slides — crossfade; cinema layout shows full photos. */
export function HomePastorPortrait({
  variant = "mobile",
  layout = "blend",
  className = "",
}: HomePastorPortraitProps) {
  const slides = useMemo(
    () =>
      (site.homePortraitSlides?.length ? site.homePortraitSlides : [site.pastorPortrait]).filter(
        Boolean,
      ),
    [],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduceMotion || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion, slides.length]);

  if (slides.length === 0) return null;

  const cinema = layout === "cinema";

  return (
    <div
      className={`home-pastor-portrait home-pastor-portrait--${variant} ${
        cinema ? "home-pastor-portrait--cinema" : ""
      } pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      {slides.map((src, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          decoding="async"
          className={`home-pastor-portrait__photo ${
            index === activeIndex ? "home-pastor-portrait__photo--active" : ""
          } ${reduceMotion ? "home-pastor-portrait__photo--static" : ""}`}
        />
      ))}
      <div className="home-pastor-portrait__scrim absolute inset-0" />
      {cinema && slides.length > 1 ? (
        <div
          className="home-pastor-portrait__dots pointer-events-none absolute inset-x-0 bottom-3 z-[2] flex justify-center gap-1.5"
          aria-hidden
        >
          {slides.map((src, index) => (
            <span
              key={src}
              className={`home-pastor-portrait__dot ${
                index === activeIndex ? "home-pastor-portrait__dot--active" : ""
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
