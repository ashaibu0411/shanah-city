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
  const { setMoreMenuOpen, messagesImmersive } = useAppShell();
  const navItems = useAppNavItems();
  if (messagesImmersive) return null;
  const moreActive = navItems
    .filter((item) => !tabs.some((tab) => tab.href === item.href))
    .some((item) => item.href === pathname);

  return (
    <nav className="app-mobile-bottom-nav mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 border-t border-white/12 bg-night-950 shadow-app-nav lg:hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sand-400/35 to-transparent" />
      <ul className="app-mobile-inner mx-auto flex w-full items-stretch justify-around px-1 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-2">
        {tabs.map((item) => {
          const active = pathname === item.href;
          const iconName = navHrefToTabIcon(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`mobile-nav-link flex flex-col items-center gap-1 rounded-xl px-1 py-0.5 transition active:scale-95 ${
                  active ? "text-white" : "text-white/85"
                }`}
              >
                <span
                  className={`mobile-nav-icon-shell flex items-center justify-center transition ${
                    active
                      ? "bg-amber-400 text-night-950 shadow-app-md ring-1 ring-amber-200/60"
                      : "bg-night-800 text-sand-100 ring-1 ring-white/15"
                  }`}
                >
                  {iconName ? (
                    <MobileTabIcon name={iconName} className="mobile-nav-icon h-5 w-5" />
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
            className={`mobile-nav-link flex w-full flex-col items-center gap-1 rounded-xl px-1 py-0.5 transition active:scale-95 ${
              moreActive ? "text-white" : "text-white/85"
            }`}
          >
            <span
              className={`mobile-nav-icon-shell flex items-center justify-center transition ${
                moreActive
                  ? "bg-amber-400 text-night-950 shadow-app-md ring-1 ring-amber-200/60"
                  : "bg-night-800 text-sand-100 ring-1 ring-white/15"
              }`}
            >
              <MobileTabIcon name="more" className="mobile-nav-icon h-5 w-5" />
            </span>
            <span className="mobile-nav-label">More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
