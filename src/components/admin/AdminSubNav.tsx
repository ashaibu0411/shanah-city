"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { filterAdminPortalLinks } from "@/lib/admin-portal-links";

type AdminSubNavProps = {
  variant?: "pills" | "sidebar";
};

export function AdminSubNav({ variant = "pills" }: AdminSubNavProps) {
  const pathname = usePathname();
  const { permissions } = useAuth();
  const links = filterAdminPortalLinks(permissions);

  if (links.length === 0) return null;

  if (variant === "sidebar") {
    return (
      <nav className="space-y-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-xl px-3 py-2.5 transition ${
                active
                  ? "bg-night-900 text-sand-50 shadow-sm"
                  : "text-night-700 hover:bg-white hover:ring-1 hover:ring-night-900/10"
              }`}
            >
              <span className="block text-sm font-semibold">{link.label}</span>
              <span
                className={`mt-0.5 block text-xs ${
                  active ? "text-sand-300" : "text-night-500"
                }`}
              >
                {link.description}
              </span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              active
                ? "bg-night-900 text-sand-50"
                : "bg-white text-night-600 ring-1 ring-night-900/10 hover:bg-sand-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
