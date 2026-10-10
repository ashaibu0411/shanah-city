"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { MemberAvatarLink } from "@/components/auth/MemberAvatarLink";
import { couplesCommunityHubBackPath } from "@/lib/couples-community-paths";

export function CouplesCommunityHeader() {
  const { user, loading } = useAuth();

  return (
    <header
      className="sticky top-0 z-30 flex min-h-[3.25rem] items-center gap-2 bg-[var(--couples-midnight)] px-[var(--couples-page-padding)] py-3 text-white safe-top"
    >
      <Link
        href={couplesCommunityHubBackPath()}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl font-light transition hover:bg-white/10 active:scale-95"
        aria-label="Back to Power Couples"
      >
        ‹
      </Link>
      <h1
        className="min-w-0 flex-1 truncate text-center font-[family-name:var(--font-couples-display)] text-[1.05rem] font-semibold tracking-tight"
      >
        Couples Community
      </h1>
      <MemberAvatarLink
        user={user}
        loading={loading}
        size="sm"
        className="!h-10 !w-10 shrink-0 ring-white/20"
      />
    </header>
  );
}
