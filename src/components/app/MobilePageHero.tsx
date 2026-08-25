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

      <div className="relative">
        {eyebrow ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300/90">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1.5 font-display text-2xl font-semibold leading-tight tracking-tight text-white">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-snug text-white/75">{description}</p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </section>
  );
}
