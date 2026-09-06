"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { filterAdminPortalLinks } from "@/lib/admin-portal-links";

export function AdminPortalHome() {
  const { permissions } = useAuth();
  const links = filterAdminPortalLinks(permissions);

  return (
    <div className="pb-8">
      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-night-950 via-night-900 to-night-800 px-6 py-6 text-sand-50 shadow-lg ring-1 ring-night-900/10 sm:px-8 sm:py-7">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-sand-400">Admin Group</p>
        <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
          Church operations portal
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sand-200/90">
          Choose a section below. Each opens on its own page, like Write devotions.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-2xl bg-white p-5 ring-1 ring-night-900/10 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-night-900/20"
          >
            <p className="font-display text-lg font-semibold text-night-900 group-hover:text-night-700">
              {link.label}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-night-600">{link.description}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-night-500">
              Open section →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
