"use client";

import { useState } from "react";
import Link from "next/link";
import { authorInitial } from "@/lib/community-ui-utils";

type CommunityAvatarProps = {
  name: string;
  authorId?: string;
  size?: "sm" | "md" | "lg" | "story";
  href?: string;
  ring?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  story: "h-[4.5rem] w-[4.5rem] text-base",
};

export function CommunityAvatar({
  name,
  authorId,
  size = "md",
  href,
  ring = false,
  className = "",
}: CommunityAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const avatarSrc =
    authorId && !imgFailed
      ? `/api/profile/avatar?userId=${encodeURIComponent(authorId)}`
      : null;

  const inner = (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e4e6eb] font-bold text-[#050505] ${
        sizeClasses[size]
      } ${className}`}
    >
      {avatarSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarSrc}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        authorInitial(name)
      )}
    </div>
  );

  const wrapped = ring ? (
    <div className="rounded-full bg-gradient-to-tr from-[#1877f2] via-[#e4405f] to-[#f77737] p-[2.5px]">
      <div className="rounded-full bg-white p-[2px]">{inner}</div>
    </div>
  ) : (
    inner
  );

  if (href) {
    return (
      <Link href={href} className="shrink-0" aria-label={`${name} profile`}>
        {wrapped}
      </Link>
    );
  }

  return wrapped;
}
