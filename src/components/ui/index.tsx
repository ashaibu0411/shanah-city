"use client";

import Link from "next/link";
import { useAppShell } from "@/components/app/AppShellContext";
import { MobilePageHero } from "@/components/app/MobilePageHero";
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
    default: "bg-night-900 text-sand-50",
    outline: "border border-night-900/20 text-night-700 bg-white",
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
    isMobileApp ? "mobile-card p-4" : "p-5"
  } ${isMobileApp && href ? "active:scale-[0.995]" : ""} rounded-2xl bg-white shadow-sm ring-1 ring-night-900/5 transition hover:shadow-md ${className}`;

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
  const styles = {
    primary: "bg-night-900 text-sand-50 shadow-app-sm hover:bg-night-800",
    secondary: "bg-white text-night-900 shadow-app-sm ring-1 ring-night-900/10 hover:bg-sand-50",
    ghost: "bg-transparent text-night-700 hover:bg-sand-100",
  };

  const base = `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold tracking-tight transition ${styles[variant]} ${disabled ? "pointer-events-none opacity-50" : ""} ${className}`;

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
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  const { isMobileApp } = useAppShell();

  if (isMobileApp) {
    return (
      <MobilePageHero eyebrow={eyebrow} title={title} description={description} />
    );
  }

  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sand-600">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-2 font-display text-3xl font-semibold text-night-900 md:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-2xl text-night-600">{description}</p>
      )}
    </div>
  );
}

export function SectionTitle({
  title,
  href,
  linkLabel = "See all",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  const { isMobileApp } = useAppShell();

  return (
    <div className="mb-4 flex items-center justify-between">
      <h2
        className={
          isMobileApp
            ? "mobile-section-title"
            : "font-display text-xl font-semibold text-night-900"
        }
      >
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className={`text-sm font-semibold ${
            isMobileApp
              ? "rounded-full bg-white px-3 py-1 text-night-700 shadow-app-sm ring-1 ring-night-900/10"
              : "text-night-600 hover:text-night-900"
          }`}
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
