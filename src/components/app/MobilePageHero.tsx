"use client";

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
    <section
      className={`mobile-page-hero relative mb-3 overflow-hidden rounded-2xl p-4 text-white shadow-app-lg ring-1 ring-night-900/10 ${className}`}
    >
      <div className="mobile-aurora-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="mobile-shimmer pointer-events-none absolute inset-0 opacity-25" aria-hidden />

      <div className="relative">
        {eyebrow ? (
          <p className="mobile-fade-up mobile-fade-up-1 text-[10px] font-bold uppercase tracking-[0.24em] text-sand-200/90">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mobile-headline mobile-fade-up mobile-fade-up-2 mt-1.5 font-display text-2xl font-bold leading-tight tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="mobile-fade-up mobile-fade-up-3 mt-2 text-sm leading-snug text-white/80">
            {description}
          </p>
        ) : null}
        {children ? (
          <div className="mobile-fade-up mobile-fade-up-4 mt-4">{children}</div>
        ) : null}
      </div>
    </section>
  );
}
