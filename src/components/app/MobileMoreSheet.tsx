"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CampusSelector } from "@/components/app/CampusSelector";
import { useAppShell } from "@/components/app/AppShellContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { site } from "@/lib/site";

const primaryTabs = [
  site.nav[0],
  site.nav[1],
  site.nav[2],
  site.nav[5],
];

const moreLinks = site.nav.filter(
  (item) => !primaryTabs.some((tab) => tab.href === item.href),
);

export function MobileMoreSheet() {
  const { moreMenuOpen, setMoreMenuOpen } = useAppShell();
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (!moreMenuOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        className="fixed inset-0 z-50 bg-night-950/40 backdrop-blur-[2px] lg:hidden"
        onClick={() => setMoreMenuOpen(false)}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl ring-1 ring-night-900/10 lg:hidden">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-night-900/15" />
        <div className="mx-auto max-w-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-night-900">More</h2>
            <button
              type="button"
              onClick={() => setMoreMenuOpen(false)}
              className="rounded-full px-3 py-1 text-sm font-semibold text-night-600 hover:bg-sand-100"
            >
              Done
            </button>
          </div>

          <div className="mb-4 rounded-2xl bg-sand-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-night-500">
              Your campus
            </p>
            <CampusSelector />
          </div>

          <div className="grid grid-cols-4 gap-3">
            {moreLinks.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreMenuOpen(false)}
                  className={`flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center transition ${
                    active
                      ? "bg-night-900 text-sand-50"
                      : "bg-sand-50 text-night-700 hover:bg-sand-100"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-[10px] font-semibold leading-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <Link
            href={site.visitCTA.href}
            onClick={() => setMoreMenuOpen(false)}
            className={`mt-4 block rounded-2xl bg-gradient-to-r ${site.visitCTA.gradient} px-4 py-4 text-center text-sm font-semibold text-white shadow-md ${site.visitCTA.hoverGradient}`}
          >
            Plan a visit · Aurora &amp; Accra
          </Link>

          {!loading && !user && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link
                href="/sign-in"
                onClick={() => setMoreMenuOpen(false)}
                className="rounded-2xl bg-sand-100 px-4 py-3 text-center text-sm font-semibold text-night-900"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMoreMenuOpen(false)}
                className="rounded-2xl bg-night-900 px-4 py-3 text-center text-sm font-semibold text-sand-50"
              >
                Join
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
