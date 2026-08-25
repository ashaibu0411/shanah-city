"use client";

import { usePathname } from "next/navigation";
import { AdminSubNav, isAdminPortalPath } from "@/components/admin/AdminSubNav";

export function AdminPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (!isAdminPortalPath(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="pb-8">
      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-night-950 via-night-900 to-night-800 px-6 py-6 text-sand-50 shadow-lg ring-1 ring-night-900/10 sm:px-8 sm:py-7">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-sand-400">
          Admin Group
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
          Church operations portal
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sand-200/90">
          Manage approvals, members, guests, giving, and finance from one place.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-sand-100/80 p-3 ring-1 ring-night-900/5 lg:p-4">
            <p className="mb-3 hidden px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-night-500 lg:block">
              Sections
            </p>
            <AdminSubNav variant="sidebar" />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
