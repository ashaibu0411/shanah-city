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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-night-900/10 bg-white/95 backdrop-blur-md lg:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {tabs.map((item) => {
          const active = pathname === item.href;
          const iconName = navHrefToTabIcon(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-semibold transition ${
                  active ? "text-night-900" : "text-night-400"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                    active ? "bg-night-900 text-sand-50 shadow-sm" : ""
                  }`}
                >
                  {iconName ? <MobileTabIcon name={iconName} /> : item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}

        <li className="flex-1">
          <button
            type="button"
            onClick={() => setMoreMenuOpen(true)}
            className={`flex w-full flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-semibold transition ${
              moreActive ? "text-night-900" : "text-night-400"
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                moreActive ? "bg-night-900 text-sand-50 shadow-sm" : ""
              }`}
            >
              <MobileTabIcon name="more" />
            </span>
            More
          </button>
        </li>
      </ul>
    </nav>
  );
}
