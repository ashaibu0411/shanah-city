"use client";

import { useEffect, useMemo, useState } from "react";
import { site } from "@/lib/site";

type HomePastorPortraitProps = {
  variant?: "mobile" | "desktop";
  className?: string;
};

const SLIDE_INTERVAL_MS = 4000;

/** Blended lead pastor portraits for home tagline heroes — gentle crossfade when multiple slides. */
export function HomePastorPortrait({
  variant = "mobile",
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

  return (
    <div
      className={`home-pastor-portrait home-pastor-portrait--${variant} pointer-events-none absolute inset-0 overflow-hidden ${className}`}
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
          }`}
        />
      ))}
      <div className="home-pastor-portrait__scrim absolute inset-0" />
    </div>
  );
}
