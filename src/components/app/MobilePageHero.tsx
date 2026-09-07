"use client";

import { MobilePremiumFrame } from "@/components/app/MobilePremiumFrame";

type MobilePageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
};

export function MobilePageHero({
  eyebrow,
  title,
  description,
  className = "",
  children,
}: MobilePageHeroProps) {
  return (
    <MobilePremiumFrame
      variant="hero"
      className={`mobile-page-hero mb-3 text-white shadow-app-lg ring-1 ring-white/10 ${className}`}
    >
      <div className="mobile-aurora-bg pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400/90 via-amber-300/50 to-teal-400/80"
        aria-hidden
      />

      <div className="relative p-4">
        {eyebrow ? (
          <p className="mobile-page-hero-eyebrow text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300/90">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1.5 font-display text-2xl font-semibold leading-tight tracking-tight text-white drop-shadow-sm">
          {title}
        </h1>
        {description ? (
          <p className="mobile-page-hero-description mt-2 text-sm leading-snug text-white/78">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </MobilePremiumFrame>
  );
}
