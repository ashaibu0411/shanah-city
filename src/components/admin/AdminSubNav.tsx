"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

const adminLinks = [
  { href: "/admin/approvals", label: "Approvals", adminOnly: true },
  { href: "/admin/alerts", label: "Urgent", adminOnly: true },
  { href: "/admin/guests", label: "Guests", adminOnly: true },
  { href: "/admin/people", label: "People", adminOnly: true },
  { href: "/admin/giving", label: "Giving", adminOnly: true, financeAllowed: true },
  { href: "/admin/finance", label: "Finance", adminOnly: false },
] as const;

export function AdminSubNav() {
  const pathname = usePathname();
  const { permissions } = useAuth();

  const links = adminLinks.filter((link) => {
    if (link.href === "/admin/finance") {
      return permissions.canAccessFinance;
    }
    if ("financeAllowed" in link && link.financeAllowed) {
      return permissions.canManageAdmin || permissions.canAccessFinance;
    }
    return permissions.canManageAdmin;
  });

  if (links.length === 0) return null;

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
