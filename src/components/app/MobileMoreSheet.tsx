"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CampusSelector } from "@/components/app/CampusSelector";
import { TextSizeControl } from "@/components/app/TextSizeControl";
import { ThemeControl } from "@/components/app/ThemeControl";
import { useAppShell } from "@/components/app/AppShellContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { site } from "@/lib/site";
import { useAppNavItems } from "@/lib/use-app-nav-items";
import { useNotifications } from "@/lib/use-notifications";

export function MobileMoreSheet() {
  const { isMobileApp, moreMenuOpen, setMoreMenuOpen } = useAppShell();
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const navItems = useAppNavItems();
  const { total: unreadTotal } = useNotifications();

  const primaryTabs = [site.nav[0], site.nav[1], site.nav[2], site.nav[5]];

  const moreLinks = navItems.filter(
    (item) => !primaryTabs.some((tab) => tab.href === item.href),
  );

  if (!isMobileApp || !moreMenuOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        className="app-mobile-more-backdrop fixed inset-0 z-[60] bg-night-950/35 backdrop-blur-sm"
        onClick={() => setMoreMenuOpen(false)}
      />
      <div className="app-mobile-more-sheet mobile-more-sheet-panel fixed inset-x-0 bottom-0 z-[60] flex max-h-[min(88dvh,100%)] flex-col overflow-hidden rounded-t-[1.75rem] ring-1 ring-night-900/8">
        <div className="mobile-more-sheet-header shrink-0 border-b border-night-900/6 px-4 pb-3 pt-4">
          <div className="app-mobile-inner relative mx-auto w-full">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-night-900/15" />
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-night-500 dark:text-sand-400">
                  Explore
                </p>
                <h2 className="font-display text-xl font-semibold text-night-900 dark:text-sand-100">
                  More
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMoreMenuOpen(false)}
                className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-night-800 ring-1 ring-night-900/10 dark:bg-[var(--color-surface)] dark:text-sand-100 dark:ring-white/10"
              >
                Done
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="app-mobile-inner relative mx-auto w-full">

          <div className="mobile-more-sheet-card mb-4 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-night-500 dark:text-sand-400">
              Your campus
            </p>
            <CampusSelector />
          </div>

          <div className="mobile-more-sheet-card mb-4 p-3">
            <ThemeControl variant="mobile" />
          </div>

          <div className="mobile-more-sheet-card mb-4 p-3">
            <TextSizeControl variant="mobile" />
          </div>

          <div className="grid grid-cols-4 gap-3">
            {moreLinks.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreMenuOpen(false)}
                  className={`relative flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center transition active:scale-[0.97] ${
                    active
                      ? "bg-amber-400 text-night-950 shadow-md ring-1 ring-amber-300/60 dark:bg-amber-500 dark:text-night-950 dark:ring-amber-400/50"
                      : "bg-white text-night-800 ring-1 ring-night-900/8 dark:bg-[var(--color-bg-muted)] dark:text-sand-100 dark:ring-white/10"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-[10px] font-semibold leading-tight">{item.label}</span>
                  {item.href === "/messages" && unreadTotal > 0 && (
                    <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {unreadTotal > 99 ? "99+" : unreadTotal}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <Link
            href={site.visitCTA.href}
            onClick={() => setMoreMenuOpen(false)}
            className="mt-4 block rounded-full bg-night-950 px-4 py-4 text-center text-sm font-semibold text-white shadow-[0_8px_24px_rgba(15,23,42,0.18)] transition hover:bg-night-900"
          >
            Plan a visit · Aurora &amp; Accra
          </Link>

          {!loading && !user && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link
                href="/sign-in"
                onClick={() => setMoreMenuOpen(false)}
                className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-night-800 ring-1 ring-night-900/10 dark:bg-[var(--color-surface)] dark:text-sand-100 dark:ring-white/10"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMoreMenuOpen(false)}
                className="rounded-2xl bg-amber-400 px-4 py-3 text-center text-sm font-semibold text-night-950"
              >
                Join
              </Link>
            </div>
          )}

          <Link
            href="/privacy"
            onClick={() => setMoreMenuOpen(false)}
            className="mt-4 block text-center text-xs font-semibold text-night-500 underline dark:text-sand-400"
          >
            Privacy Policy
          </Link>
          <Link
            href="/delete-account"
            onClick={() => setMoreMenuOpen(false)}
            className="mt-1 block text-center text-xs font-semibold text-night-500 underline dark:text-sand-400"
          >
            Delete account
          </Link>
          </div>
        </div>
      </div>
    </>
  );
}
