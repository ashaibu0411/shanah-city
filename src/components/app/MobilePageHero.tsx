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
      className={`mobile-page-hero relative mb-3 overflow-hidden rounded-[1.25rem] p-4 text-white shadow-app-lg ring-1 ring-teal-700/20 ${className}`}
    >
      <div className="mobile-aurora-bg pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-cyan-300/25 blur-2xl"
        aria-hidden
      />

      <div className="relative">
        {eyebrow ? (
          <p className="mobile-page-hero-eyebrow text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-100/95">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1.5 font-sans text-2xl font-bold leading-tight tracking-tight text-white">
          {title}
        </h1>
        {description ? (
          <p className="mobile-page-hero-description mt-2 text-sm leading-snug text-white/75">{description}</p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </section>
  );
}
