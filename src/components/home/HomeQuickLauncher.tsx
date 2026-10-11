"use client";

import Link from "next/link";

type LauncherItem = {
  id: string;
  label: string;
  href: string;
};

const LAUNCHER_ITEMS: LauncherItem[] = [
  { id: "community", label: "Community", href: "/community" },
  { id: "calendar", label: "Events", href: "/calendar" },
  { id: "live", label: "Media", href: "/live" },
  { id: "groups", label: "Groups", href: "/groups" },
  { id: "devotions", label: "Devotions", href: "/devotions" },
  { id: "sermons", label: "Sermons", href: "/sermons" },
  { id: "give", label: "Give", href: "/give" },
  { id: "messages", label: "Messages", href: "/messages" },
];

function LauncherIcon({ id }: { id: string }) {
  const shared = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-6 w-6 text-night-700 dark:text-sand-200",
    "aria-hidden": true,
  };

  switch (id) {
    case "community":
      return (
        <svg {...shared}>
          <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...shared}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case "live":
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m10 9 6 4-6 4V9Z" />
        </svg>
      );
    case "groups":
      return (
        <svg {...shared}>
          <path d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3Z" />
          <path d="M8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Z" />
          <path d="M8 13c-2.67 0-8 1.34-8 4v2h8" />
          <path d="M16 13c-.34 0-.67.02-1 .06 1.17.84 2 2.05 2 3.44V19h6v-2c0-2.66-5.33-4-8-4Z" />
        </svg>
      );
    case "devotions":
      return (
        <svg {...shared}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H18v16.5H6.5A2.5 2.5 0 0 0 4 22V5.5Z" />
          <path d="M8 7h8M8 11h6" />
        </svg>
      );
    case "sermons":
      return (
        <svg {...shared}>
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8" />
        </svg>
      );
    case "give":
      return (
        <svg {...shared}>
          <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10Z" />
        </svg>
      );
    case "messages":
      return (
        <svg {...shared}>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
        </svg>
      );
    default:
      return null;
  }
}

function LauncherTile({ item }: { item: LauncherItem }) {
  const inner = (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sand-100 dark:bg-night-800/80">
        <LauncherIcon id={item.id} />
      </span>
      <span className="mt-2 text-center text-[11px] font-semibold leading-tight text-night-800 dark:text-sand-100">
        {item.label}
      </span>
    </>
  );

  const className =
    "mobile-home-launcher-tile flex flex-col items-center justify-center rounded-2xl bg-white px-2 py-3 ring-1 ring-night-900/8 transition active:scale-[0.97] dark:bg-[var(--color-surface)] dark:ring-white/10";

  return (
    <Link href={item.href} className={className}>
      {inner}
    </Link>
  );
}

/** Primary app destinations — mockup-style grid, Shanah routes. */
export function HomeQuickLauncher() {
  const items = LAUNCHER_ITEMS;

  return (
    <section className="mobile-home-launcher -mt-3 rounded-2xl bg-[var(--color-bg-soft)] px-3 py-4 ring-1 ring-night-900/6 dark:ring-white/10">
      <div className="grid grid-cols-4 gap-2.5">
        {items.map((item) => (
          <LauncherTile key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
