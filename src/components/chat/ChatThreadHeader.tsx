"use client";

import type { ReactNode } from "react";
import { messagingUi } from "@/lib/messaging-ui";

type ChatThreadHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  avatar?: ReactNode;
  onAvatarClick?: () => void;
  trailing?: ReactNode;
  menu?: ReactNode;
};

export function ChatThreadHeader({
  title,
  subtitle,
  onBack,
  avatar,
  onAvatarClick,
  trailing,
  menu,
}: ChatThreadHeaderProps) {
  return (
    <header className={messagingUi.threadHeader}>
      <div className="flex min-w-0 items-center gap-2">
        {onBack ? (
          <button type="button" onClick={onBack} className={messagingUi.threadHeaderBack} aria-label="Back">
            <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
              <path
                fill="currentColor"
                d="M11.78 4.22a.75.75 0 0 1 0 1.06L8.06 9l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
              />
            </svg>
          </button>
        ) : (
          <span className="w-10 shrink-0" aria-hidden />
        )}
        <button
          type="button"
          onClick={onAvatarClick}
          disabled={!onAvatarClick}
          className={`flex min-w-0 flex-1 items-center gap-2.5 text-left ${onAvatarClick ? "hover:opacity-90" : "cursor-default"}`}
        >
          {avatar ? <span className={messagingUi.threadHeaderAvatar}>{avatar}</span> : null}
          <div className="min-w-0 flex-1">
            <p className={messagingUi.threadHeaderTitle}>{title}</p>
            {subtitle ? <p className={messagingUi.threadHeaderSubtitle}>{subtitle}</p> : null}
          </div>
        </button>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {trailing}
        {menu}
      </div>
    </header>
  );
}
