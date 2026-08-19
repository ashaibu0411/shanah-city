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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-night-950/94 shadow-[0_-12px_40px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
        {tabs.map((item) => {
          const active = pathname === item.href;
          const iconName = navHrefToTabIcon(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`mobile-nav-link flex flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-semibold transition active:scale-95 ${
                  active ? "text-white" : "text-white/45"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl transition ${
                    active
                      ? "bg-gradient-to-br from-amber-400 via-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/35 ring-1 ring-white/20"
                      : ""
                  }`}
                >
                  {iconName ? <MobileTabIcon name={iconName} /> : item.icon}
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
            className={`mobile-nav-link flex w-full flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-semibold transition active:scale-95 ${
              moreActive ? "text-white" : "text-white/45"
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-2xl transition ${
                moreActive
                  ? "bg-gradient-to-br from-amber-400 via-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/35 ring-1 ring-white/20"
                  : ""
              }`}
            >
              <MobileTabIcon name="more" />
            </span>
            <span className="mobile-nav-label">More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
