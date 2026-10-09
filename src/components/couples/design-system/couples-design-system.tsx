"use client";

import Image from "next/image";
import Link from "next/link";
import { couplesHubPremium, COUPLES_HUB_HERO_IMAGE } from "@/components/couples/couples-hub-premium";
/* ——— Typography helpers ——— */
export const couplesDisplayFont = "font-[family-name:var(--font-couples-display)]";
export const couplesUiFont = "font-[family-name:var(--font-couples-ui)]";

/* 1. Page header (sub-pages; group shell uses CouplesHubGroupHeader) */
export function CouplesPageHeader({
  title,
  backHref,
  onBack,
  backLabel = "Back",
  rightSlot,
}: {
  title: string;
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
  rightSlot?: React.ReactNode;
}) {
  const backClass =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl font-light transition hover:bg-white/10 active:scale-95";
  return (
    <header className="couples-page-header sticky top-0 z-20 flex min-h-[3.25rem] items-center gap-2 bg-[var(--couples-midnight)] px-[var(--couples-page-padding)] py-3 text-white safe-top">
      {onBack ? (
        <button type="button" className={backClass} onClick={onBack} aria-label={backLabel}>
          ‹
        </button>
      ) : backHref ? (
        <Link href={backHref} className={backClass} aria-label={backLabel}>
          ‹
        </Link>
      ) : (
        <span className="h-11 w-11 shrink-0" />
      )}
      <h1
        className={`${couplesDisplayFont} min-w-0 flex-1 truncate text-center text-[1.05rem] font-semibold tracking-tight`}
      >
        {title}
      </h1>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center">{rightSlot}</div>
    </header>
  );
}

/* 2. Bottom nav — use app shell; placeholder documents contract */
export function CouplesBottomNavigation() {
  return null;
}

/* 3. Hero card */
export function CouplesHeroCard({
  title,
  tagline,
  imageSrc = COUPLES_HUB_HERO_IMAGE,
  cropFlyerBranding = false,
  showHeart = false,
  layout = "card",
  children,
}: {
  title: string;
  tagline?: string;
  imageSrc?: string;
  cropFlyerBranding?: boolean;
  showHeart?: boolean;
  /** `banner` — compact home hero (~240–300px). `card` — tall editorial hero. */
  layout?: "card" | "banner";
  children?: React.ReactNode;
}) {
  if (layout === "banner") {
    return (
      <div className="couples-hero-banner px-[var(--couples-page-padding)] pt-2">
        <div className="couples-hero-banner__frame relative mx-auto w-full max-w-lg overflow-hidden rounded-[var(--couples-radius-hero-home)]">
          <div className="couples-hero-banner__media relative h-[clamp(15rem,42vw,18.75rem)] w-full">
            <Image
              src={imageSrc}
              alt=""
              fill
              priority
              className={`object-cover ${cropFlyerBranding ? "scale-[1.35] object-[50%_18%]" : "object-[center_35%]"}`}
              sizes="(max-width: 512px) 100vw, 512px"
            />
            <div className="couples-hero-banner__gradient absolute inset-0" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 p-5 text-left">
              <h2
                className={`${couplesDisplayFont} flex items-center gap-2 text-[1.875rem] font-semibold leading-tight tracking-tight text-white sm:text-[2rem]`}
              >
                <span>{title}</span>
                {showHeart ? (
                  <span
                    className="text-[1.35rem] font-normal text-[var(--couples-gold-light)]"
                    aria-hidden
                  >
                    ♡
                  </span>
                ) : null}
              </h2>
              {tagline ? (
                <p className="mt-1.5 max-w-[18rem] text-[0.9375rem] leading-relaxed text-white/92">
                  {tagline}
                </p>
              ) : null}
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-[var(--couples-page-padding)] pt-2">
      <div className="couples-hero-card relative mx-auto w-full max-w-lg overflow-hidden rounded-[var(--couples-radius-hero)] shadow-[var(--couples-shadow-hero)]">
        <div className="relative aspect-[4/5] max-h-[28rem] w-full min-h-[17.5rem] sm:aspect-[3/4]">
          <Image
            src={imageSrc}
            alt=""
            fill
            priority
            className={`object-cover ${cropFlyerBranding ? "scale-[1.42] object-[50%_14%]" : "object-[center_30%]"}`}
            sizes="(max-width: 512px) 100vw, 512px"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[var(--couples-midnight)]/92 via-[var(--couples-mocha)]/35 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-5 pb-6">
            <h2
              className={`${couplesDisplayFont} flex items-center gap-2 text-[1.875rem] font-semibold leading-tight tracking-tight text-white sm:text-[2.125rem]`}
            >
              <span>{title}</span>
              {showHeart ? (
                <span className="text-2xl font-normal text-[var(--couples-gold-light)]" aria-hidden>
                  ♡
                </span>
              ) : null}
            </h2>
            {tagline ? (
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-white/90">{tagline}</p>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* 4. Feature card (home CTAs) */
export function CouplesFeatureCard({
  icon,
  title,
  subtitle,
  onClick,
  href,
  variant = "marriage",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  href?: string;
  variant?: "marriage" | "community";
}) {
  const className = `couples-feature-card flex w-full min-h-[6.25rem] items-center gap-3.5 rounded-[var(--couples-radius-card)] px-4 py-3.5 text-left text-white transition active:scale-[0.99] motion-reduce:transition-none ${
    variant === "marriage" ? "couples-feature-card--marriage" : "couples-feature-card--community"
  }`;
  const inner = (
    <>
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm"
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`${couplesDisplayFont} block text-[1.0625rem] font-semibold leading-snug`}>
          {title}
        </span>
        <span className="mt-0.5 block text-[0.8125rem] font-normal leading-snug text-white/88">
          {subtitle}
        </span>
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center text-white/75" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path
            d="M9 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick}>
      {inner}
    </button>
  );
}

/* 5. Section heading */
export function CouplesSectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      {eyebrow ? (
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[var(--couples-gold)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className={`${couplesDisplayFont} mt-1 text-[1.25rem] font-semibold text-[var(--couples-text)]`}>
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm leading-relaxed text-[var(--couples-muted)]">{description}</p>
      ) : null}
    </div>
  );
}

/* 6–7. Buttons */
export function CouplesPrimaryButton({
  children,
  className,
  disabled,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`couples-btn-primary inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-[var(--couples-radius-button)] px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-50 motion-reduce:transition-none ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function CouplesSecondaryButton({
  children,
  className,
  href,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}) {
  const styles = `couples-btn-secondary inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-[var(--couples-radius-button)] border px-4 py-3 text-sm font-semibold transition active:scale-[0.99] motion-reduce:transition-none ${className ?? ""}`;
  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={styles} onClick={onClick}>
      {children}
    </button>
  );
}

/* 8. Empty state */
export function CouplesEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--couples-radius-card)] border border-dashed border-[var(--couples-border)] bg-[var(--couples-surface)] px-5 py-10 text-center">
      <p className={`${couplesDisplayFont} text-lg font-semibold text-[var(--couples-text)]`}>{title}</p>
      {description ? <p className="mt-2 text-sm text-[var(--couples-muted)]">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/* 9. Progress card */
export function CouplesProgressCard({
  label,
  value,
  max = 100,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="rounded-[var(--couples-radius-card)] border border-[var(--couples-border)] bg-[var(--couples-surface)] p-4 shadow-[var(--couples-shadow-card)]">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium text-[var(--couples-text)]">{label}</span>
        <span className="text-[var(--couples-muted)]">{pct}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--couples-gold-light)]/60">
        <div
          className="h-full rounded-full bg-[var(--couples-gold)] transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* 10. List item */
export function CouplesListItem({
  icon,
  title,
  subtitle,
  onClick,
  href,
  trailing,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  href?: string;
  trailing?: React.ReactNode;
}) {
  const className = `${couplesHubPremium.sheetListRow} min-h-[3.25rem] border-[var(--couples-border)] bg-[var(--couples-surface)] active:scale-[0.99] motion-reduce:transition-none`;
  const content = (
    <>
      {icon ? (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--couples-gold-light)]/50 text-lg">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[0.9375rem] font-semibold text-[var(--couples-text)]">{title}</span>
        {subtitle ? (
          <span className="mt-0.5 block text-xs text-[var(--couples-muted)]">{subtitle}</span>
        ) : null}
      </span>
      {trailing ?? <span className="text-[var(--couples-muted)]" aria-hidden>›</span>}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  );
}

/* 11. Avatar */
export function CouplesAvatar({
  name,
  imageUrl,
  size = "md",
}: {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "h-9 w-9 text-sm" : size === "lg" ? "h-14 w-14 text-lg" : "h-11 w-11 text-base";
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  if (imageUrl) {
    return (
      <span className={`relative ${dim} shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--couples-gold-light)]`}>
        <Image src={imageUrl} alt="" fill className="object-cover" sizes="56px" />
      </span>
    );
  }
  return (
    <span
      className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-[var(--couples-mocha)] font-semibold text-white`}
    >
      {initial}
    </span>
  );
}

/* 12. Modal */
export function CouplesModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[250] flex items-end justify-center bg-[var(--couples-midnight)]/50 p-4 sm:items-center motion-reduce:transition-none"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[var(--couples-radius-card)] bg-[var(--couples-surface)] p-5 shadow-xl safe-bottom">
        <div className="flex items-start justify-between gap-3">
          <h2 className={`${couplesDisplayFont} text-lg font-semibold text-[var(--couples-text)]`}>{title}</h2>
          <button
            type="button"
            className="rounded-full bg-[var(--couples-background)] px-3 py-1.5 text-sm font-semibold text-[var(--couples-muted)]"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

/* Home shortcut chip (horizontal carousel) */
export function CouplesShortcutTile({
  title,
  icon,
  href,
  tone = "sage",
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
  tone?: "sage" | "blush" | "blue" | "lavender" | "gold";
}) {
  return (
    <Link
      href={href}
      className={`couples-shortcut-tile couples-shortcut-tile--${tone} flex min-h-[5.5rem] w-[7.25rem] shrink-0 flex-col items-center justify-center gap-2 rounded-[1.125rem] px-3 py-3 text-center transition active:scale-[0.98] motion-reduce:transition-none`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/55 text-lg shadow-sm">
        {icon}
      </span>
      <span className="text-[0.8125rem] font-semibold leading-tight text-[var(--couples-text)]">{title}</span>
    </Link>
  );
}

/* 13. Loading skeleton */
export function CouplesLoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3 motion-reduce:animate-none" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-20 rounded-[var(--couples-radius-card)] bg-[var(--couples-border)]/80"
        />
      ))}
    </div>
  );
}
