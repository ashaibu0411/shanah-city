"use client";

import Link from "next/link";

type PageBackLinkProps = {
  href: string;
  label: string;
  className?: string;
};

export function PageBackLink({ href, label, className = "" }: PageBackLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full bg-sand-100/95 px-3.5 py-2 text-sm font-semibold text-night-800 shadow-sm ring-1 ring-night-900/8 transition hover:bg-white active:scale-[0.98] dark:bg-[var(--color-bg-soft)] dark:text-sand-100 dark:ring-white/10 dark:hover:bg-[var(--color-surface)] ${className}`.trim()}
    >
      <span className="text-base leading-none" aria-hidden>
        ←
      </span>
      {label}
    </Link>
  );
}
