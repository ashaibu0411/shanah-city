"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminSectionChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPortalHome = pathname === "/admin";
  const isStandaloneAdminTool = pathname === "/admin/devotions";

  if (isPortalHome || isStandaloneAdminTool) {
    return <>{children}</>;
  }

  return (
    <div className="pb-8">
      <Link
        href="/admin"
        className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-night-600 transition hover:text-night-900"
      >
        ← Admin portal
      </Link>
      {children}
    </div>
  );
}
