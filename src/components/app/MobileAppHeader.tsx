"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/app/BrandLogo";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { MemberAvatarLink } from "@/components/auth/MemberAvatarLink";
import { useApp } from "@/components/app/AppProvider";
import { liveStream, site } from "@/lib/site";
import { Badge } from "@/components/ui";

const pageTitles: Record<string, string> = {
  "/": "Home",
  "/live": "Media & Live",
  "/devotions": "Devotions",
  "/meetings": "Meetings",
  "/community": "Community",
  "/messages": "Messages",
  "/admin/devotions": "Write Devotions",
  "/calendar": "Calendar",
  "/check-in": "Check-in",
  "/photos": "Photos",
  "/shop": "Shop",
  "/campuses": "Campuses",
  "/give": "Give",
  "/profile": "Profile",
  "/sign-in": "Sign in",
  "/sign-up": "Join",
  "/sermons": "Sermons",
  "/about": "About",
  "/connect": "Connect",
};

export function MobileAppHeader() {
  const pathname = usePathname();
  const { campus } = useApp();
  const { user, loading } = useAuth();
  const title = pageTitles[pathname] ?? site.name;
  const isHome = pathname === "/";
  const anyLive =
    liveStream.isLive ||
    liveStream.youtube.isLive ||
    liveStream.facebook.isLive;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-night-950/90 shadow-lg shadow-indigo-950/20 backdrop-blur-xl lg:hidden">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/30 to-transparent" />
      <div className="relative mx-auto flex max-w-lg items-center justify-between gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0 flex-1">
          {isHome ? (
            <>
              <p className="text-xs font-medium text-white/60">
                {getGreeting()} · {campus.city}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <BrandLogo size="sm" priority />
                {anyLive && (
                  <Link href="/live">
                    <Badge variant="live">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      Live
                    </Badge>
                  </Link>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-medium text-white/60">{site.name}</p>
              <h1 className="truncate font-display text-lg font-semibold text-white">
                {title}
              </h1>
            </>
          )}
        </div>

        <MemberAvatarLink user={user} loading={loading} />
      </div>
    </header>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
