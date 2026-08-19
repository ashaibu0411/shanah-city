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
      className={`mobile-page-hero relative mb-4 overflow-hidden rounded-[1.75rem] p-5 text-white shadow-2xl shadow-indigo-950/40 ring-1 ring-white/10 ${className}`}
    >
      <div className="mobile-aurora-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="mobile-shimmer pointer-events-none absolute inset-0 opacity-40" aria-hidden />

      <div className="relative">
        {eyebrow ? (
          <p className="mobile-fade-up mobile-fade-up-1 text-xs font-bold uppercase tracking-[0.22em] text-amber-200/90">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mobile-headline mobile-fade-up mobile-fade-up-2 mt-2 font-display text-[1.65rem] font-bold leading-tight tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="mobile-fade-up mobile-fade-up-3 mt-3 text-sm leading-relaxed text-white/75">
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
