"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppNavItems } from "@/lib/use-app-nav-items";

export function AppSidebar() {
  const pathname = usePathname();
  const navItems = useAppNavItems();

  return (
    <aside className="app-desktop-sidebar hidden w-64 shrink-0 border-r border-night-900/5 bg-white lg:block">
      <nav className="sticky top-[65px] flex h-[calc(100vh-65px)] flex-col p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-night-400">
          Menu
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-night-900 text-sand-50"
                      : "text-night-600 hover:bg-sand-100 hover:text-night-900"
                  }`}
                >
                  <span className="w-4 text-center">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto rounded-2xl bg-gradient-to-br from-night-900 to-night-800 p-4 text-sand-50">
          <p className="text-xs font-semibold uppercase tracking-wider text-sand-300">
            Daily habit
          </p>
          <p className="mt-2 text-sm leading-relaxed text-sand-200/90">
            Open devotions each morning and stay connected with your campus.
          </p>
          <Link
            href="/devotions"
            className="mt-3 inline-block text-sm font-semibold text-sand-100 hover:text-white"
          >
            Start today →
          </Link>
        </div>
      </nav>
    </aside>
  );
}
