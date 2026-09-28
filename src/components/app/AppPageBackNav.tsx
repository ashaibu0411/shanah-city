"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useAppShell } from "@/components/app/AppShellContext";
import { PageBackLink } from "@/components/app/PageBackLink";
import { resolvePageBackLink } from "@/lib/page-back-navigation";

export function AppPageBackNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { messagesImmersive } = useAppShell();
  const back = resolvePageBackLink(pathname, searchParams);

  if (messagesImmersive || !back) {
    return null;
  }

  return (
    <nav className="app-page-back-nav mb-3" aria-label="Back navigation">
      <PageBackLink href={back.href} label={back.label} />
    </nav>
  );
}
