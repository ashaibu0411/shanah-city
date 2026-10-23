"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/app/BrandLogo";
import { AppNavIconGlyph } from "@/components/home/premium/PremiumHomeIcons";
import { useAppNavItems } from "@/lib/use-app-nav-items";

export function AppSidebar() {
  const pathname = usePathname();
  const navItems = useAppNavItems();

  return (
    <aside className="app-desktop-sidebar app-sidebar-premium hidden shrink-0 lg:block">
      <nav className="sticky top-[65px] flex h-[calc(100vh-65px)] flex-col p-4">
        <Link href="/" className="mb-5 flex items-center gap-2 px-1">
          <BrandLogo size="sm" priority />
        </Link>

        <ul className="app-sidebar-premium__nav">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`app-sidebar-premium__link ${active ? "app-sidebar-premium__link--active" : ""}`}
                >
                  <AppNavIconGlyph href={item.href} className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="app-sidebar-premium__habit">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-white/70">
            Daily habit
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/85">
            Open devotions each morning and stay connected with your campus.
          </p>
          <Link
            href="/devotions"
            className="mt-3 inline-block text-sm font-semibold text-[var(--premium-gold)] hover:text-white"
          >
            Start today →
          </Link>
        </div>
      </nav>
    </aside>
  );
}
