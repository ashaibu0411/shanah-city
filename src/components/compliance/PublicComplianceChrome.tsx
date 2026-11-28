import Link from "next/link";
import type { ReactNode } from "react";
import { brandLogos, site } from "@/lib/site";

export function PublicComplianceChrome({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#17191c]">
      <header className="border-b border-[#e5dfd4] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="https://shanahcity.org" className="flex items-center gap-2" aria-label="Shanah City Church home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brandLogos.dark} alt="Shanah City" className="h-9 w-auto" />
          </a>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-3 text-xs font-semibold sm:text-sm">
            <Link href="/privacy" className="text-[#667085] hover:text-[#10264a]">
              Privacy
            </Link>
            <Link href="/terms" className="text-[#667085] hover:text-[#10264a]">
              Terms
            </Link>
            <Link href="/sms-consent" className="text-[#10264a]">
              SMS consent
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>
      <footer className="border-t border-[#e5dfd4] bg-white">
        <div className="mx-auto max-w-3xl space-y-2 px-4 py-6 text-sm text-[#667085] sm:px-6">
          <p>
            {site.name} · {site.address} ·{" "}
            <a className="underline" href={`mailto:${site.email}`}>
              {site.email}
            </a>{" "}
            · {site.phone}
          </p>
          <p className="text-xs">© {year} Shanah City Church. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}