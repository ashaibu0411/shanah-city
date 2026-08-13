"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/app/BrandLogo";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/app/AppProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { MemberAvatarLink } from "@/components/auth/MemberAvatarLink";
import { CampusSelector } from "@/components/app/CampusSelector";
import { liveStream, site } from "@/lib/site";
import { Badge, ExternalLink } from "@/components/ui";

export function TopBar() {
  const pathname = usePathname();
  const { cartCount } = useApp();
  const { user, loading } = useAuth();
  const anyLive =
    liveStream.isLive ||
    liveStream.youtube.isLive ||
    liveStream.facebook.isLive;

  return (
    <header className="sticky top-0 z-40 border-b border-night-900/5 bg-sand-50/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <BrandLogo size="md" priority />
          </Link>
          {anyLive && pathname !== "/live" && (
            <Link href="/live">
              <Badge variant="live">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                LIVE
              </Badge>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <CampusSelector />
          <Link
            href="/shop"
            className="relative rounded-xl p-2 text-night-700 transition hover:bg-white"
            aria-label="Shop cart"
          >
            <span className="text-lg">🛒</span>
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-night-900 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {!loading && user ? (
            <MemberAvatarLink user={user} size="sm" className="hidden sm:flex" />
          ) : (
            <Link
              href="/sign-in"
              className="hidden rounded-full bg-night-900 px-3 py-1.5 text-xs font-semibold text-sand-50 sm:inline-flex"
            >
              Sign In
            </Link>
          )}

          <ExternalLink
            href={site.website}
            className="hidden rounded-full border border-night-900/15 px-3 py-1.5 text-xs font-semibold text-night-700 transition hover:bg-white lg:inline-flex"
          >
            shanahcity.org
          </ExternalLink>
        </div>
      </div>
    </header>
  );
}
