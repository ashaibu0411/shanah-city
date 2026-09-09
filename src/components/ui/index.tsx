"use client";

import Link from "next/link";
import { useAppShell } from "@/components/app/AppShellContext";
import { MobilePageHero } from "@/components/app/MobilePageHero";
import { editorialPremium, formatEditorialSectionLabel } from "@/components/app/editorial-premium";
import { openExternalUrl } from "@/lib/native-app";
import { site } from "@/lib/site";

function isExternalHref(href: string) {
  return /^(https?:\/\/|mailto:|tel:)/i.test(href);
}

export function ExternalLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  async function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!/^https?:\/\//i.test(href)) return;
    event.preventDefault();
    await openExternalUrl(href);
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}

type BadgeProps = {
  children: React.ReactNode;
  variant?: "live" | "default" | "outline";
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  const styles = {
    live: "bg-red-500 text-white animate-pulse-soft",
    default: editorialPremium.badgeDefault,
    outline: editorialPremium.badgeOutline,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

type CardProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
};

export function Card({ children, className = "", href }: CardProps) {
  const { isMobileApp } = useAppShell();
  const classes = `${
    isMobileApp ? `mobile-card ${editorialPremium.card}` : `${editorialPremium.card}`
  } ${isMobileApp && href ? "active:scale-[0.995]" : ""} ${
    !isMobileApp ? "transition hover:shadow-md" : "transition hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
  } ${className}`;

  if (href) {
    if (isExternalHref(href)) {
      return (
        <ExternalLink href={href} className={`block ${classes}`}>
          {children}
        </ExternalLink>
      );
    }
    return (
      <Link href={href} className={`block ${classes}`}>
        {children}
      </Link>
    );
  }

  return <div className={classes}>{children}</div>;
}

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
};

export function Button({
  children,
  onClick,
  href,
  variant = "primary",
  className = "",
  type = "button",
  disabled = false,
}: ButtonProps) {
  const { isMobileApp } = useAppShell();
  const styles = {
    primary: isMobileApp
      ? editorialPremium.primaryButton
      : editorialPremium.primaryButton,
    secondary: isMobileApp
      ? editorialPremium.secondaryButton
      : editorialPremium.secondaryButton,
    ghost: isMobileApp
      ? editorialPremium.ghostButton
      : editorialPremium.ghostButton,
  };

  const base = `inline-flex items-center justify-center gap-2 text-sm font-semibold tracking-tight transition ${styles[variant]} ${disabled ? "pointer-events-none opacity-50" : ""} ${className}`;

  if (href && !disabled) {
    if (isExternalHref(href)) {
      return (
        <ExternalLink href={href} className={base}>
          {children}
        </ExternalLink>
      );
    }
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={base} disabled={disabled}>
      {children}
    </button>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  sectionIndex,
  accentWord,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  sectionIndex?: number;
  accentWord?: string;
}) {
  const { isMobileApp } = useAppShell();

  if (isMobileApp) {
    return (
      <MobilePageHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        sectionIndex={sectionIndex}
        accentWord={accentWord}
      />
    );
  }

  const eyebrowText =
    eyebrow && sectionIndex != null
      ? formatEditorialSectionLabel(sectionIndex, eyebrow)
      : eyebrow;

  const titleContent =
    accentWord && title.includes(accentWord) ? (
      <>
        {title.split(accentWord)[0]}
        <span className="text-clay-600">{accentWord}</span>
        {title.split(accentWord).slice(1).join(accentWord)}
      </>
    ) : (
      title
    );

  return (
    <div className={`${editorialPremium.pageHeader} mb-8`}>
      {eyebrowText ? (
        <p className={editorialPremium.pageEyebrow}>{eyebrowText}</p>
      ) : null}
      <h1 className={`${editorialPremium.pageTitle} sm:text-4xl`}>{titleContent}</h1>
      {description ? (
        <p className={`${editorialPremium.pageDescription} max-w-2xl text-base`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function SectionTitle({
  title,
  href,
  linkLabel = "See all",
  sectionIndex,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  sectionIndex?: number;
}) {
  const { isMobileApp } = useAppShell();
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {sectionIndex != null ? (
          <p className={editorialPremium.sectionLabel}>
            № {String(sectionIndex).padStart(2, "0")}
          </p>
        ) : null}
        <h2 className={editorialPremium.sectionTitle}>{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className={`shrink-0 text-sm font-semibold ${
            isMobileApp
              ? editorialPremium.secondaryButton
              : "text-night-600 hover:text-night-900"
          }`}
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
