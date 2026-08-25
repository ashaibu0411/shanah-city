"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CampusSelector } from "@/components/app/CampusSelector";
import { useReadability } from "@/components/app/ReadabilityProvider";
import { useAppShell } from "@/components/app/AppShellContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { site } from "@/lib/site";
import { useAppNavItems } from "@/lib/use-app-nav-items";
import { useNotifications } from "@/lib/use-notifications";

export function MobileMoreSheet() {
  const { isMobileApp, moreMenuOpen, setMoreMenuOpen } = useAppShell();
  const { textScale, setTextScale } = useReadability();
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
        className="app-mobile-more-backdrop fixed inset-0 z-[60] bg-night-950/50 backdrop-blur-sm"
        onClick={() => setMoreMenuOpen(false)}
      />
      <div className="app-mobile-more-sheet fixed inset-x-0 bottom-0 z-[60] overflow-hidden rounded-t-[1.75rem] bg-night-950 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl ring-1 ring-white/10">
        <div className="app-mobile-inner relative mx-auto max-w-lg">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/25" />
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300/90">
                Explore
              </p>
              <h2 className="font-display text-xl font-semibold text-white">More</h2>
            </div>
            <button
              type="button"
              onClick={() => setMoreMenuOpen(false)}
              className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white ring-1 ring-white/15"
            >
              Done
            </button>
          </div>

          <div className="mb-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sand-300/80">
              Your campus
            </p>
            <CampusSelector />
          </div>

          <div className="mb-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <p className="text-sm font-semibold text-white">Text size</p>
            <p className="mt-0.5 text-sm text-white/60">Applies across the mobile app</p>
            <div
              className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-night-900/60 p-1 ring-1 ring-white/10"
              role="group"
              aria-label="Text size"
            >
              {(
                [
                  { id: "comfortable", label: "Standard" },
                  { id: "large", label: "Large" },
                  { id: "extraLarge", label: "Extra large" },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTextScale(option.id)}
                  className={`rounded-lg px-2 py-2.5 text-xs font-bold transition ${
                    textScale === option.id
                      ? "bg-amber-400 text-night-950"
                      : "text-white/70 hover:bg-white/10"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
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
                      ? "bg-amber-400 text-night-950 shadow-md"
                      : "bg-white text-night-800 ring-1 ring-night-900/8"
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
            className="mt-4 block rounded-2xl bg-amber-400 px-4 py-4 text-center text-sm font-semibold text-night-950 shadow-md transition hover:bg-amber-300"
          >
            Plan a visit · Aurora &amp; Accra
          </Link>

          {!loading && !user && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link
                href="/sign-in"
                onClick={() => setMoreMenuOpen(false)}
                className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white ring-1 ring-white/15"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMoreMenuOpen(false)}
                className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-night-900"
              >
                Join
              </Link>
            </div>
          )}

          <Link
            href="/privacy"
            onClick={() => setMoreMenuOpen(false)}
            className="mt-4 block text-center text-xs font-semibold text-white/55 underline"
          >
            Privacy Policy
          </Link>
          <Link
            href="/delete-account"
            onClick={() => setMoreMenuOpen(false)}
            className="mt-1 block text-center text-xs font-semibold text-white/55 underline"
          >
            Delete account
          </Link>
        </div>
      </div>
    </>
  );
}
