"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppShell } from "@/components/app/AppShellContext";
import { MobileTabIcon, navHrefToTabIcon } from "@/components/app/MobileTabIcon";
import { site } from "@/lib/site";
import { useAppNavItems } from "@/lib/use-app-nav-items";

const tabs = [
  site.nav[0],
  site.nav[1],
  site.nav[2],
  site.nav[5],
];

export function MobileNav() {
  const pathname = usePathname();
  const { setMoreMenuOpen } = useAppShell();
  const navItems = useAppNavItems();
  const moreActive = navItems
    .filter((item) => !tabs.some((tab) => tab.href === item.href))
    .some((item) => item.href === pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/8 bg-night-950/97 shadow-app-nav backdrop-blur-2xl lg:hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sand-400/20 to-transparent" />
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-0.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
        {tabs.map((item) => {
          const active = pathname === item.href;
          const iconName = navHrefToTabIcon(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`mobile-nav-link flex flex-col items-center gap-0.5 rounded-xl px-1 py-1 transition active:scale-95 ${
                  active ? "text-white" : "text-white/75"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                    active
                      ? "bg-gradient-to-br from-sand-300 via-amber-400 to-sand-500 text-night-950 shadow-app-md ring-1 ring-white/25"
                      : "bg-white/8 text-white ring-1 ring-white/10"
                  }`}
                >
                  {iconName ? (
                    <MobileTabIcon name={iconName} className="h-5 w-5" />
                  ) : (
                    item.icon
                  )}
                </span>
                <span className="mobile-nav-label">{item.label}</span>
              </Link>
            </li>
          );
        })}

        <li className="flex-1">
          <button
            type="button"
            onClick={() => setMoreMenuOpen(true)}
            className={`mobile-nav-link flex w-full flex-col items-center gap-0.5 rounded-xl px-1 py-1 transition active:scale-95 ${
              moreActive ? "text-white" : "text-white/75"
            }`}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                moreActive
                  ? "bg-gradient-to-br from-sand-300 via-amber-400 to-sand-500 text-night-950 shadow-app-md ring-1 ring-white/25"
                  : "bg-white/8 text-white ring-1 ring-white/10"
              }`}
            >
              <MobileTabIcon name="more" className="h-5 w-5" />
            </span>
            <span className="mobile-nav-label">More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
