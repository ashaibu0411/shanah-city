"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { MemberAvatarLink } from "@/components/auth/MemberAvatarLink";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { site } from "@/lib/site";

/** Power Couples home — midnight brand bar with notifications and profile. */
export function CouplesHubHomeHeader() {
  const { user, loading } = useAuth();

  return (
    <header
      className="couples-hub-home-header sticky top-0 z-30 bg-[var(--couples-midnight)] px-[var(--couples-page-padding)] pb-3.5 pt-[max(0.65rem,env(safe-area-inset-top))]"
    >
      <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-white/90">
            {site.name}
          </p>
          <p className="mt-0.5 text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-[var(--couples-gold-light)]">
            Power Couples
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="couples-hub-home-header__bell">
            <NotificationBell variant="dark" />
          </div>
          <MemberAvatarLink user={user} loading={loading} size="sm" className="!h-10 !w-10 ring-white/20" />
        </div>
      </div>
    </header>
  );
}
