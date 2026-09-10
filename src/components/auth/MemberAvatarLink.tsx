"use client";

import Link from "next/link";
import type { PublicMember } from "@/lib/auth-types";
import { getMemberAvatarApiUrl } from "@/lib/avatar-utils";
import { getPublicDisplayName } from "@/lib/member-display-name";

type MemberAvatarLinkProps = {
  user: PublicMember | null;
  loading?: boolean;
  href?: string;
  size?: "sm" | "md";
  className?: string;
};

const sizes = {
  sm: "h-9 w-9 text-sm",
  md: "h-10 w-10 text-sm",
};

export function MemberAvatarLink({
  user,
  loading = false,
  href,
  size = "md",
  className = "",
}: MemberAvatarLinkProps) {
  const targetHref = href ?? (user ? "/profile" : "/sign-in");
  const avatarSrc = user
    ? getMemberAvatarApiUrl(user.id, user.avatarUrl, user.updatedAt)
    : null;

  const circleClass = `flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-night-900 font-bold text-sand-50 ring-1 ring-night-900/10 ${sizes[size]} ${className}`;

  const publicName = user ? getPublicDisplayName(user) : "Profile";

  return (
    <Link
      href={targetHref}
      className={circleClass}
      aria-label={loading ? "Account" : user ? "Profile" : "Sign in"}
    >
      {avatarSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarSrc} alt={publicName} className="h-full w-full object-cover" />
      ) : user ? (
        publicName.charAt(0).toUpperCase()
      ) : (
        "☺"
      )}
    </Link>
  );
}
