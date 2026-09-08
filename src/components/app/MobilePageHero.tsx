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
    <div
      className={`mobile-warm-page-header mb-3 overflow-hidden rounded-[1.35rem] p-4 ring-1 ring-teal-200/45 ${className}`}
    >
      {eyebrow ? (
        <p className="mobile-warm-page-header-eyebrow text-[10px] font-bold uppercase tracking-[0.24em] text-teal-700">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-night-900">
        {title}
      </h1>
      {description ? (
        <p className="mobile-warm-page-header-description mt-2 text-sm leading-snug text-night-600">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
